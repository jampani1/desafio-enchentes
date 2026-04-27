const express = require('express')
const Joi = require('joi')
const pool = require('../db')
const { authRequired, hasRole } = require('../middlewares/auth')

const router = express.Router()

const tipoRecursoSchema = Joi.object({
  nome: Joi.string().min(2).max(255).required(),
  categoria: Joi.string()
    .valid('hidratacao', 'higiene', 'fraldas', 'alimento_nao_perec', 'primeira_infancia',
           'saude', 'vestuario', 'dormir', 'limpeza', 'emergencia', 'pets')
    .required(),
  unidade_medida: Joi.string().max(20).required(),
  tamanho_padrao: Joi.string().max(50).allow('', null),
})

// publico - lista todos os tipos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tipo_recurso ORDER BY categoria, nome'
    )
    res.status(200).json(result.rows)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// admin: gestao de catalogo (papel admin alem de auditor)

router.post('/', authRequired, hasRole('admin'), async (req, res) => {
  const { error, value } = tipoRecursoSchema.validate(req.body)
  if (error) return res.status(400).json({ erro: error.details[0].message })

  try {
    const result = await pool.query(
      `INSERT INTO tipo_recurso (nome, categoria, unidade_medida, tamanho_padrao)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [value.nome, value.categoria, value.unidade_medida, value.tamanho_padrao || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

router.put('/:id', authRequired, hasRole('admin'), async (req, res) => {
  const { error, value } = tipoRecursoSchema.validate(req.body)
  if (error) return res.status(400).json({ erro: error.details[0].message })

  try {
    const result = await pool.query(
      `UPDATE tipo_recurso
       SET nome = $1, categoria = $2, unidade_medida = $3, tamanho_padrao = $4
       WHERE id = $5
       RETURNING *`,
      [value.nome, value.categoria, value.unidade_medida, value.tamanho_padrao || null, req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'tipo nao encontrado' })
    }
    res.status(200).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

router.delete('/:id', authRequired, hasRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM tipo_recurso WHERE id = $1', [req.params.id])
    res.sendStatus(204)
  } catch (err) {
    // 23503 = FK violation (tipo em uso por oferta/estoque/regra)
    if (err.code === '23503') {
      return res.status(409).json({ erro: 'tipo em uso, nao pode deletar' })
    }
    res.status(500).json({ erro: err.message })
  }
})

module.exports = router
