const express = require('express')
const Joi = require('joi')
const pool = require('../db')
const { authRequired, hasRole } = require('../middlewares/auth')

const router = express.Router()

//schemas do joi - abrigo
const abrigoSchema = Joi.object({
  nome: Joi.string().min(2).max(255).required(),
  localizacao: Joi.string().min(2).max(500).required(),
  capacidade: Joi.number().integer().min(1).required(),
})

//schemas do joi - tipo pessoa
const pessoaSchema = Joi.object({
  categoria: Joi.string()
    .valid('idoso_h', 'idoso_m', 'adulto_h', 'adulto_m', 'crianca_0_3', 'crianca_4_12', 'adolescente')
    .required(),
  qtd: Joi.number().integer().min(0).required(),
})

//schemas do joi - caso especial
const casoSchema = Joi.object({
  condicao: Joi.string()
    .valid('diabetes', 'cardiaco', 'gestante', 'bebe_lactente', 'cadeirante', 'acamado', 'autista', 'alergia_grave')
    .required(),
  observacao: Joi.string().max(1000).allow('', null),
})

//schemas do joi - estoque
const estoqueSchema = Joi.object({
  tipo_recurso_id: Joi.number().integer().required(),
  quantidade_atual: Joi.number().integer().min(0).required(),
})

//middleware para verificar se eh "dono" do abrigo ou admin
//Usado nas rotas de modificacao

async function ehDonoOuAdmin(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT coordenador_id FROM abrigo WHERE id = $1',
      [req.params.id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'abrigo nao encontrado' })
    }
    if (req.user.role !== 'admin' && rows[0].coordenador_id !== req.user.id) {
      return res.status(403).json({ erro: 'voce nao e dono deste abrigo' })
    }
    next()
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
}

//coordenador cria abrigo
router.post('/', authRequired, hasRole('coordenador'), async (req, res) => {
  // repeticao - validacao Joi
  const { error, value } = abrigoSchema.validate(req.body)
  if (error) return res.status(400).json({ erro: error.details[0].message })

  try {
    const result = await pool.query(`
      INSERT INTO abrigo (nome, coordenador_id, localizacao, capacidade)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [value.nome, req.user.id, value.localizacao, value.capacidade]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

//publico lista todos os abrigos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM abrigo
      ORDER BY criado_em DESC`)
      res.json(result.rows)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

//publico ve detalhes de um abrigo
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT * FROM abrigo WHERE id = $1`,
        [req.params.id]
      )
      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'abrigo nao encontrado' })
      }
      res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

//dono ou admin atualiza
router.put('/:id', authRequired, ehDonoOuAdmin, async (req, res) => {
  // repeticao - validacao Joi
  const { error, value } = abrigoSchema.validate(req.body)
  if (error) return res.status(400).json({ erro: error.details[0].message })

  try {
    const result = await pool.query(`
      UPDATE abrigo
      SET nome = $1, localizacao = $2, capacidade = $3
      WHERE id = $4
      RETURNING *
      `,
    [value.nome, value.localizacao, value.capacidade, req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// DELETE /:id — dono ou admin deleta
router.delete('/:id', authRequired, ehDonoOuAdmin, async (req, res) => {
  try {
    // TODO: DELETE FROM abrigo WHERE id = $1
    // res.sendStatus(204)
    await pool.query(`DELETE FROM abrigo WHERE id = $1`, [req.params.id])
    //204 como convencao em REST 
    res.sendStatus(204)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// ============================================================
// SUB-ROTA: pessoas abrigadas (demografia agregada)
// ============================================================

// POST /:id/pessoas — UPSERT (cria ou atualiza qtd da categoria)
router.post('/:id/pessoas', authRequired, ehDonoOuAdmin, async (req, res) => {
  // repeticao - validacao Joi
  const { error, value } = pessoaSchema.validate(req.body)
  if (error) return res.status(400).json({ erro: error.details[0].message })

  //atomicidade - sem race condition 
  //atomic insert-or-update
  //por exemplo, só existe uma linha com abrigo_id + categoria (de pessoa) na tabela do abrigo
  //quando encontra esse 'match' > atualiza, se nao encontra, insert
  try {
    const result = await pool.query(
      `INSERT INTO pessoa_abrigada (abrigo_id, categoria, qtd)
       VALUES ($1, $2, $3)
       ON CONFLICT (abrigo_id, categoria)
       DO UPDATE SET qtd = EXCLUDED.qtd, atualizado_em = NOW()
       RETURNING *`,
      [req.params.id, value.categoria, value.qtd]
    )
    res.status(200).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// GET /:id/pessoas — qualquer um pode ver (dado agregado nao identificado)
router.get('/:id/pessoas', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pessoa_abrigada WHERE abrigo_id = $1 ORDER BY categoria',
      [req.params.id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// ============================================================
// SUB-ROTA: casos especiais (sem identificacao)
// ============================================================

// POST /:id/casos
router.post('/:id/casos', authRequired, ehDonoOuAdmin, async (req, res) => {
  // repeticao - validacao Joi
  const { error, value } = casoSchema.validate(req.body)
  if (error) return res.status(400).json({ erro: error.details[0].message })

  try {
    const result = await pool.query(
      `INSERT INTO caso_especial (abrigo_id, condicao, observacao)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.id, value.condicao, value.observacao || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// GET /:id/casos — apenas dono ou admin (info sensivel mesmo agregada)
router.get('/:id/casos', authRequired, ehDonoOuAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM caso_especial WHERE abrigo_id = $1 ORDER BY criado_em DESC',
      [req.params.id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// ============================================================
// SUB-ROTA: estoque do abrigo
// ============================================================

// PUT /:id/estoque — UPSERT (cria ou atualiza qtd do tipo de recurso)
router.put('/:id/estoque', authRequired, ehDonoOuAdmin, async (req, res) => {
  // repeticao - validacao Joi
  const { error, value } = estoqueSchema.validate(req.body)
  if (error) return res.status(400).json({ erro: error.details[0].message })

  try {
    const result = await pool.query(
      `INSERT INTO estoque (abrigo_id, tipo_recurso_id, quantidade_atual)
       VALUES ($1, $2, $3)
       ON CONFLICT (abrigo_id, tipo_recurso_id)
       DO UPDATE SET quantidade_atual = EXCLUDED.quantidade_atual,
                     atualizado_em = NOW()
       RETURNING *`,
      [req.params.id, value.tipo_recurso_id, value.quantidade_atual]
    )
    res.status(200).json(result.rows[0])
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ erro: 'tipo de recurso invalido' })
    }
    res.status(500).json({ erro: err.message })
  }
})

// GET /:id/estoque — publico (transparencia: doador ve quanto cada abrigo tem)
router.get('/:id/estoque', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, t.nome AS tipo_nome, t.categoria, t.unidade_medida
       FROM estoque e
       JOIN tipo_recurso t ON t.id = e.tipo_recurso_id
       WHERE e.abrigo_id = $1
       ORDER BY t.categoria, t.nome`,
      [req.params.id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

module.exports = router
