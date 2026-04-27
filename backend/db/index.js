require('dotenv').config()
const { Pool } = require('pg')

// Aceita 2 formas de configurar conexao:
//   1) DATABASE_URL   — provido automaticamente pelo Render quando o servico de Postgres
//                       eh linkado ao web service. Usado em producao.
//   2) DB_HOST/PORT/USER/PASSWORD/NAME — campos individuais. Usado em dev local.
//
// Em producao (Render), exigir SSL. Em dev local, sem SSL.
const useSSL = !!process.env.DATABASE_URL

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })

module.exports = pool
