const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Joi = require('joi')
const pool = require('../db')

const router = express.Router()

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().required(),
})

// POST /auth/login
router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ erro: error.details[0].message })
  }

  try {
    const result = await pool.query(
      'SELECT id, email, senha_hash, role, nome FROM usuario WHERE email = $1',
      [value.email]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ erro: 'credenciais invalidas' })
    }

    const user = result.rows[0]
    const ok = await bcrypt.compare(value.senha, user.senha_hash)
    if (!ok) {
      return res.status(401).json({ erro: 'credenciais invalidas' })
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )
    res.json({
      token,
      usuario: { id: user.id, nome: user.nome, email: user.email, role: user.role },
    })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

module.exports = router
