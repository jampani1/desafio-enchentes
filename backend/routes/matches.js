const express = require('express')
const Joi = require('joi')
const pool = require('../db')
const { authRequired } = require('../middlewares/auth')

const router = express.Router()

const matchSchema = Joi.object({
  necessidade_id: Joi.string().uuid().required(),
  oferta_id: Joi.string().uuid().required(),
  qtd_casada: Joi.number().integer().min(1).required(),
})

const statusSchema = Joi.object({
  status: Joi.string().valid('aceito', 'em_entrega', 'recebido', 'cancelado').required(),
})

// POST / — propor match (oferta + necessidade)
// TRANSACAO para travar a oferta com FOR UPDATE; (race condition).

router.post('/', authRequired, async (req, res) => {
  const { error, value } = matchSchema.validate(req.body)
  if (error) return res.status(400).json({ erro: error.details[0].message })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // trava a oferta — outras transacoes esperam ate COMMIT/ROLLBACK
    const { rows: ofertaRows } = await client.query(
      'SELECT * FROM oferta WHERE id = $1 FOR UPDATE',
      [value.oferta_id]
    )
    if (ofertaRows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ erro: 'oferta nao encontrada' })
    }
    const oferta = ofertaRows[0]
    if (oferta.status !== 'ofertada') {
      await client.query('ROLLBACK')
      return res.status(409).json({ erro: 'oferta indisponivel' })
    }
    if (value.qtd_casada > oferta.qtd_ofertada) {
      await client.query('ROLLBACK')
      return res.status(400).json({ erro: 'qtd casada maior que qtd ofertada' })
    }

    // 2. trava a necessidade
    const { rows: necRows } = await client.query(
      'SELECT * FROM necessidade WHERE id = $1 FOR UPDATE',
      [value.necessidade_id]
    )
    if (necRows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ erro: 'necessidade nao encontrada' })
    }

    // 3. cria o match
    const { rows: matchRows } = await client.query(
      `INSERT INTO match_doacao (necessidade_id, oferta_id, qtd_casada, status)
       VALUES ($1, $2, $3, 'proposto')
       RETURNING *`,
      [value.necessidade_id, value.oferta_id, value.qtd_casada]
    )

    // 4. atualiza status da oferta — sai do "ofertada" e fica "em_match"
    await client.query(
      "UPDATE oferta SET status = 'em_match' WHERE id = $1",
      [value.oferta_id]
    )

    await client.query('COMMIT')
    res.status(201).json(matchRows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ erro: err.message })
  } finally {
    client.release()
  }
})

// PUT /:id/status — atualiza status do match
// Side effects:
//   status='recebido'   → estoque += qtd_casada,
//                         oferta vira 'entregue',
//                         necessidade vira 'atendida' ou 'parcialmente_atendida'
//   status='cancelado'  → oferta volta pra 'ofertada' (libera pra outros)
//   status='aceito' / 'em_entrega' → so atualiza o match, sem cascata

router.put('/:id/status', authRequired, async (req, res) => {
  const { error, value } = statusSchema.validate(req.body)
  if (error) return res.status(400).json({ erro: error.details[0].message })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // busca o match com tudo que precisa (JOIN + FOR UPDATE)
    const { rows: matchRows } = await client.query(
      `SELECT m.*,
              o.tipo_recurso_id, o.qtd_ofertada, o.doador_id,
              n.abrigo_id, n.qtd_necessaria
       FROM match_doacao m
       JOIN oferta o ON o.id = m.oferta_id
       JOIN necessidade n ON n.id = m.necessidade_id
       WHERE m.id = $1
       FOR UPDATE`,
      [req.params.id]
    )
    if (matchRows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ erro: 'match nao encontrado' })
    }
    const match = matchRows[0]

    // side effects do 'recebido'
    if (value.status === 'recebido') {
      // soma qtd_casada no estoque do abrigo (UPSERT)
      await client.query(
        `INSERT INTO estoque (abrigo_id, tipo_recurso_id, quantidade_atual)
         VALUES ($1, $2, $3)
         ON CONFLICT (abrigo_id, tipo_recurso_id)
         DO UPDATE SET quantidade_atual = estoque.quantidade_atual + EXCLUDED.quantidade_atual,
                       atualizado_em = NOW()`,
        [match.abrigo_id, match.tipo_recurso_id, match.qtd_casada]
      )

      // marca oferta como entregue
      await client.query(
        "UPDATE oferta SET status = 'entregue' WHERE id = $1",
        [match.oferta_id]
      )

      // necessidade: atendida (se cobriu) ou parcialmente_atendida
      await client.query(
        `UPDATE necessidade
         SET status = CASE
           WHEN qtd_necessaria <= $2 THEN 'atendida'
           ELSE 'parcialmente_atendida'
         END
         WHERE id = $1`,
        [match.necessidade_id, match.qtd_casada]
      )
    }

    // side effects do 'cancelado'
    if (value.status === 'cancelado') {
      // libera a oferta pra outros doadores tentarem
      await client.query(
        "UPDATE oferta SET status = 'ofertada' WHERE id = $1",
        [match.oferta_id]
      )
    }

    // atualiza o status do match (e timestamp se for 'recebido')
    const { rows: updatedRows } = await client.query(
      `UPDATE match_doacao
       SET status = $1,
           confirmado_em = CASE WHEN $1 = 'recebido' THEN NOW() ELSE confirmado_em END
       WHERE id = $2
       RETURNING *`,
      [value.status, req.params.id]
    )

    await client.query('COMMIT')
    res.json(updatedRows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ erro: err.message })
  } finally {
    client.release()
  }
})

// ============================================================
// GET /minhas — matches do usuario logado
// doador      → matches via oferta.doador_id
// coordenador → matches via abrigo.coordenador_id
// admin       → 403 (admin usa outras telas; nao tem "match proprio")
// ============================================================

router.get('/minhas', authRequired, async (req, res) => {
  try {
    let result
    if (req.user.role === 'doador') {
      result = await pool.query(
        `SELECT m.*, t.nome AS tipo_nome, t.unidade_medida, a.nome AS abrigo_nome
         FROM match_doacao m
         JOIN oferta o ON o.id = m.oferta_id
         JOIN necessidade n ON n.id = m.necessidade_id
         JOIN abrigo a ON a.id = n.abrigo_id
         JOIN tipo_recurso t ON t.id = o.tipo_recurso_id
         WHERE o.doador_id = $1
         ORDER BY m.criado_em DESC`,
        [req.user.id]
      )
    } else if (req.user.role === 'coordenador') {
      result = await pool.query(
        `SELECT m.*, t.nome AS tipo_nome, t.unidade_medida, u.nome AS doador_nome
         FROM match_doacao m
         JOIN necessidade n ON n.id = m.necessidade_id
         JOIN abrigo a ON a.id = n.abrigo_id
         JOIN oferta o ON o.id = m.oferta_id
         JOIN tipo_recurso t ON t.id = o.tipo_recurso_id
         JOIN usuario u ON u.id = o.doador_id
         WHERE a.coordenador_id = $1
         ORDER BY m.criado_em DESC`,
        [req.user.id]
      )
    } else {
      return res.status(403).json({ erro: 'role nao suportada' })
    }
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

module.exports = router
