require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
const pool = require('./db')

const PORT = process.env.PORT || 3000

// Middlewares globais
app.use(cors())
app.use(express.json())

// Health checks
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok'})
})

app.get('/health/db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()')
        res.status(200).json({ db: 'ok', now: result.rows[0].now })
    } catch (err) {
        res.status(500).json({ db: 'erro', erro: err.message })
    }
})

// Rotas de dominio
app.use('/usuarios', require('./routes/usuarios'))
app.use('/auth', require('./routes/auth'))
app.use('/necessidades', require('./routes/necessidades'))
app.use('/ofertas', require('./routes/ofertas'))
app.use('/abrigos', require('./routes/abrigos'))
app.use('/tipos-recurso', require('./routes/tiposRecurso'))
app.use('/matches', require('./routes/matches'))
app.use('/publico', require('./routes/publico'))


app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
})

