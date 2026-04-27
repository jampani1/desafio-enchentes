const express = require('express')
const bcrypt = require('bcrypt')
const Joi = require('joi')
const pool = require('../db')
const { authRequired } = require('../middlewares/auth')

const router = express.Router()

const cadastroSchema = Joi.object({
  nome: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(6).required(),
  role: Joi.string().valid('coordenador', 'doador', 'admin').required(),
  cpf_ou_cnpj: Joi.string().max(20).allow('', null),
  telefone: Joi.string().max(20).allow('', null),
})

// POST /usuarios — cadastro publico
router.post('/', async (req, res) => {
  const { error, value } = cadastroSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ erro: error.details[0].message })
  }

  try {
    const senha_hash = await bcrypt.hash(value.senha, 10)
    const result = await pool.query(
      `INSERT INTO usuario (nome, email, senha_hash, role, cpf_ou_cnpj, telefone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, email, role, cpf_ou_cnpj, telefone, criado_em`,
      [
        value.nome,
        value.email,
        senha_hash,
        value.role,
        value.cpf_ou_cnpj || null,
        value.telefone || null,
      ]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') {
      // unique_violation (email duplicado)
      return res.status(409).json({ erro: 'email ja cadastrado' })
    }
    res.status(500).json({ erro: err.message })
  }
})

// GET /usuarios/me — dados do usuario autenticado
router.get('/me', authRequired, async (req, res) => {
  const result = await pool.query(
    `SELECT id, nome, email, role, cpf_ou_cnpj, telefone, criado_em
     FROM usuario WHERE id = $1`,
    [req.user.id]
  )
  if (result.rows.length === 0) {
    return res.status(404).json({ erro: 'usuario nao encontrado' })
  }
  res.json(result.rows[0])
})

module.exports = router
