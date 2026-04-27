const express = require('express')
const pool = require('../db')

const router = express.Router()

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

module.exports = router
