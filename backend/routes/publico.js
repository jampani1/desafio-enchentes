const express = require('express')
const pool = require('../db')

const router = express.Router()

const PREVIEW_ROLES = ['coordenador', 'doador', 'voluntario']

//lista publica de abrigos com calculo de vagas
router.get('/abrigos', async (req, res) => {
  try {
    //left join para trazer abrigos mesmo sem pessoa_abrigada
    //sum(p.qtd) agrega quantidades de varias linhas em um numero
    //coalesce troca 'null' por 0
    // ::int casta para inteiro para garantir number normal em js
    const result = await pool.query(`
      SELECT
        a.id,
        a.nome,
        a.localizacao,
        a.capacidade,
        COALESCE(SUM(p.qtd), 0)::int AS ocupacao_atual,
        (a.capacidade - COALESCE(SUM(p.qtd), 0))::int AS vagas
      FROM abrigo a
      LEFT JOIN pessoa_abrigada p ON p.abrigo_id = a.id
      GROUP BY a.id
      ORDER BY a.nome
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// POST /publico/preview-views/:role
// Tracking fire-and-forget chamado pelo frontend quando alguem abre uma demo.
// Sem auth (proposito: medir trafego de previews antes do cadastro).
// Roles validas: coordenador, doador, voluntario. Outras: 400.
router.post('/preview-views/:role', async (req, res) => {
  const { role } = req.params
  if (!PREVIEW_ROLES.includes(role)) {
    return res.status(400).json({ erro: 'role invalida' })
  }
  try {
    // UPSERT: cria a linha com count=1 ou incrementa se ja existe
    const result = await pool.query(
      `INSERT INTO preview_view (role, count) VALUES ($1, 1)
       ON CONFLICT (role)
       DO UPDATE SET count = preview_view.count + 1, ultimo_acesso = NOW()
       RETURNING role, count, ultimo_acesso`,
      [role]
    )
    res.status(200).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// GET /publico/preview-views
// Retorna contadores globais. Util pro painel admin mostrar tracking
// alem do localStorage do navegador.
router.get('/preview-views', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT role, count, ultimo_acesso FROM preview_view ORDER BY count DESC`
    )
    // garante que as 3 roles aparecem mesmo com count 0
    const map = new Map(result.rows.map((r) => [r.role, r]))
    const items = PREVIEW_ROLES.map((role) => ({
      role,
      count: map.get(role)?.count ?? 0,
      ultimo_acesso: map.get(role)?.ultimo_acesso ?? null,
    }))
    const total = items.reduce((acc, x) => acc + x.count, 0)
    res.json({ total, items })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

module.exports = router
