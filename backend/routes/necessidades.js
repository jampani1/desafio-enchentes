const express = require('express')
const Joi = require('joi')
const pool = require('../db')
const { authRequired, hasRole } = require('../middlewares/auth')
const { calcularNecessidades } = require('../services/calculoNecessidade')

const router = express.Router()

const calcSchema = Joi.object({
  prazoDias: Joi.number().integer().min(1).max(365).default(7),
})

// schema da query string do GET /
// // .default() preenche valores quando a query nao manda
const listarSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('calculada', 'aberta', 'parcialmente_atendida', 'atendida', 'expirada'),
  abrigo_id: Joi.string().uuid(),
})

/*
  POST /calcular/:abrigoId — wrapper http do service
  GET / — listagem publica paginada (doadores consomem)

  service isolado permite cron job futuro sem precisar de http
*/

// GET / — listagem paginada de necessidades (publica)
//   query params: ?page=1&limit=20&status=aberta&abrigo_id=uuid
//   response: { total, page, limit, items: [...] }

router.get('/', async (req, res) => {
  // validacao da query string (com defaults aplicados)
  const { error, value } = listarSchema.validate(req.query)
  if (error) return res.status(400).json({ erro: error.details[0].message })

  const { page, limit, status, abrigo_id } = value
  const offset = (page - 1) * limit  // paginacao = pular (page-1)*limit linhas

  // construcao dinamica do WHERE — so adiciona filtros que vieram na query
  const where = []
  const params = []
  if (status) {
    where.push(`n.status = $${params.length + 1}`)
    params.push(status)
  } else {
    // default: so as que interessam pra doador (em aberto ou parcialmente atendidas)
    where.push(`n.status IN ('aberta', 'parcialmente_atendida')`)
  }
  if (abrigo_id) {
    where.push(`n.abrigo_id = $${params.length + 1}`)
    params.push(abrigo_id)
  }
  const whereSQL = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''

  try {
    //    isso permite frontend mostrar "pagina 3 de 25" sem buscar tudo
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM necessidade n ${whereSQL}`,
      params
    )
    const total = parseInt(countResult.rows[0].total)

    //    SELECT paginado — LIMIT pega N linhas, OFFSET pula N anteriores
    //    JOINs trazem nome do recurso e do abrigo (util pro frontend)
    //    LEFT JOIN match_doacao agrega qtd_em_entrega: total ja "comprometido"
    //    via matches ativos (proposto/aceito/em_entrega). Permite mostrar
    //    "precisa 200 unidades · 130 em entrega" no frontend.
    const itemsResult = await pool.query(
      `SELECT n.*,
              t.nome AS tipo_nome, t.categoria, t.unidade_medida,
              a.nome AS abrigo_nome, a.localizacao,
              COALESCE(
                SUM(m.qtd_casada) FILTER (
                  WHERE m.status IN ('proposto', 'aceito', 'em_entrega')
                ), 0
              )::int AS qtd_em_entrega
       FROM necessidade n
       JOIN tipo_recurso t ON t.id = n.tipo_recurso_id
       JOIN abrigo a ON a.id = n.abrigo_id
       LEFT JOIN match_doacao m ON m.necessidade_id = n.id
       ${whereSQL}
       GROUP BY n.id, t.nome, t.categoria, t.unidade_medida, a.nome, a.localizacao
       ORDER BY n.prazo, n.calculada_em DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    )

    res.json({
      total,
      page,
      limit,
      items: itemsResult.rows,
    })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// POST /calcular/:abrigoId — dispara o service de calculo

router.post('/calcular/:abrigoId', authRequired, hasRole('coordenador', 'admin'), async (req, res) => {
  // validar req.body com calcSchema
  const { error, value } = calcSchema.validate(req.body)
    if (error) {
  return res.status(400).json({ erro: error.details[0].message })
}
  // checar ownership: se NÃO for admin - query que busca de qual abrigo eh o coordenador que faz a solicitacao
  if (req.user.role !== 'admin') {
  const { rows } = await pool.query(
    'SELECT coordenador_id FROM abrigo WHERE id = $1',
    //isso eh o :abrigoId que vem da URL / rota
    [req.params.abrigoId]
  )
  //    se abrigo não existe → 404
  if (rows.length === 0) {
    return res.status(404).json({ erro: 'abrigo nao encontrado' })
  }
  //    se coordenador_id !== req.user.id → 403
  if (rows[0].coordenador_id !== req.user.id) {
    return res.status(403).json({ erro: 'voce nao e dono deste abrigo' })
  }
  // 404 antes de 403: primeiro existe; depois pertence
  // se só utilizassemos 403 - evita enumeration attacks - interessante em sistemas de high security
}
  // try/catch chamando calcularNecessidades(abrigoId, prazoDias)
  try {
    const necessidades = await calcularNecessidades(req.params.abrigoId, value.prazoDias)
    // retornar total (com length) permite frontend usar esse numero sem calcular
      // retornar 201 com { total: array.length, necessidades: array }
    res.status(201).json({ total: necessidades.length, necessidades })
    } catch (err) {
        res.status(500).json({ erro: err.message })
    }

})

module.exports = router