const express = require('express')
const Joi = require('joi')
const pool = require('../db')
const { authRequired, hasRole } = require('../middlewares/auth')

const router = express.Router()

//aqui criamos um load do schema igual nos outros lugares
const ofertaSchema = Joi.object({
  tipo_recurso_id: Joi.number().integer().required(),
  qtd_ofertada: Joi.number().integer().min(1).required(),
  data_entrega: Joi.date().min('now').required()
  //min now > nao pode entregar no passado, obviamente
})


router.post('/', authRequired, hasRole('doador'), async (req, res) => {
  //depois do load do schema, sempre precisamos validar
  const { error, value } = ofertaSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ erro: error.details[0].message })
  }

  try {
  const result = await pool.query(
    `INSERT INTO oferta (doador_id, tipo_recurso_id, qtd_ofertada, data_entrega)
    VALUES ($1, $2, $3, $4)
    RETURNING *`, 
    [req.user.id, value.tipo_recurso_id, value.qtd_ofertada, value.data_entrega]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    // 23503 eh violacao de chave estrangeira no postgres > quando doador quer doar item que nao esta cadastrado
    //a tabela oferta tem FK pra tipo_recurso(id), e se o ID não existir, esse é o código que vem
    if (err.code === '23503') {
      return res.status(400).json({ erro: 'tipo de recurso invalido' })
    }
    res.status(500).json({ erro: err.message })
  }
})

router.get('/', async (req, res) => {
  try {
    // querie pega todos os campos da oferta + 2 campos do tipo de recurso (nme e unidade)
    // sem where o.doador_id = $1 para pegar todas as ofertas
    const result = await pool.query(
      `SELECT o.id, o.qtd_ofertada, o.status, o.data_entrega, o.criado_em,
          t.nome AS tipo_nome, t.unidade_medida,
          u.nome AS doador_nome
       FROM oferta o
       JOIN tipo_recurso t ON t.id = o.tipo_recurso_id
       JOIN usuario u ON u.id = o.doador_id
       WHERE o.status = 'ofertada'
       ORDER BY o.criado_em DESC`,
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ erro: err.message})
  }
})

router.get('/minhas', authRequired, hasRole('doador'), async (req, res) => {
  try {
    // querie pega todos os campos da oferta + 2 campos do tipo de recurso (nme e unidade)
    // where o.doador_id = $1 pega as ofertas do doador que esta fazendo o /minhas
    const result = await pool.query(
      `SELECT o.*, t.nome AS tipo_nome, t.unidade_medida
       FROM oferta o
       JOIN tipo_recurso t ON t.id = o.tipo_recurso_id
       WHERE o.doador_id = $1
       ORDER BY o.criado_em DESC`,
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ erro: err.message})
  }
})

module.exports = router