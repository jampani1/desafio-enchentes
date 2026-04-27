// db/seed.js — popula a base com dados minimos pra demonstracao.
//
// Uso:
//   node db/seed.js               (usa o pool padrao: DATABASE_URL ou DB_*)
//   DATABASE_URL=... node db/seed.js   (forca conexao em outro DB)
//
// Idempotente: roda quantas vezes quiser sem duplicar — usa ON CONFLICT
// por email (usuario) e por nome (abrigo).
//
// Cria 3 usuarios (admin, coordenador, doador) com senhas hashadas e 1
// abrigo de exemplo com demografia + estoque pra que o coordenador
// demonstre o calculo de necessidades imediatamente.

require('dotenv').config()
const bcrypt = require('bcrypt')
const pool = require('./index')

// Credenciais demo — TROCAR antes de qualquer uso real.
// Em prod, defina via env vars (SEED_*) pra nao deixar hardcoded.
const SEED = {
  admin: {
    nome: process.env.SEED_ADMIN_NOME || 'Maurício Jampani',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@desafio-enchentes.dev',
    senha: process.env.SEED_ADMIN_SENHA || 'admin123!seguro',
  },
  coord: {
    nome: 'Ana Cordeiro',
    email: 'coord@demo.dev',
    senha: 'demo123',
  },
  doador: {
    nome: 'Atacadão Solidário Ltda',
    email: 'doador@demo.dev',
    senha: 'demo123',
    cpf_ou_cnpj: '12.345.678/0001-99',
  },
}

async function upsertUsuario(client, { nome, email, senha, role, cpf_ou_cnpj = null, telefone = null }) {
  const hash = await bcrypt.hash(senha, 10)
  const { rows } = await client.query(
    `INSERT INTO usuario (nome, email, senha_hash, role, cpf_ou_cnpj, telefone)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO UPDATE
       SET nome = EXCLUDED.nome,
           senha_hash = EXCLUDED.senha_hash,
           role = EXCLUDED.role,
           cpf_ou_cnpj = EXCLUDED.cpf_ou_cnpj,
           telefone = EXCLUDED.telefone
     RETURNING id, email, role`,
    [nome, email, hash, role, cpf_ou_cnpj, telefone]
  )
  return rows[0]
}

async function upsertAbrigo(client, { nome, coordenador_id, localizacao, capacidade }) {
  // como abrigo nao tem unique no nome, fazemos check manual:
  // se ja existe abrigo desse coordenador com mesmo nome, atualiza
  const { rows: existentes } = await client.query(
    `SELECT id FROM abrigo WHERE coordenador_id = $1 AND nome = $2`,
    [coordenador_id, nome]
  )
  if (existentes.length > 0) {
    const id = existentes[0].id
    await client.query(
      `UPDATE abrigo SET localizacao = $1, capacidade = $2 WHERE id = $3`,
      [localizacao, capacidade, id]
    )
    return { id, atualizado: true }
  }
  const { rows } = await client.query(
    `INSERT INTO abrigo (nome, coordenador_id, localizacao, capacidade)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [nome, coordenador_id, localizacao, capacidade]
  )
  return { id: rows[0].id, atualizado: false }
}

async function upsertPessoa(client, { abrigo_id, categoria, qtd }) {
  await client.query(
    `INSERT INTO pessoa_abrigada (abrigo_id, categoria, qtd)
     VALUES ($1, $2, $3)
     ON CONFLICT (abrigo_id, categoria)
     DO UPDATE SET qtd = EXCLUDED.qtd, atualizado_em = NOW()`,
    [abrigo_id, categoria, qtd]
  )
}

async function upsertEstoque(client, { abrigo_id, tipo_recurso_id, quantidade_atual }) {
  await client.query(
    `INSERT INTO estoque (abrigo_id, tipo_recurso_id, quantidade_atual)
     VALUES ($1, $2, $3)
     ON CONFLICT (abrigo_id, tipo_recurso_id)
     DO UPDATE SET quantidade_atual = EXCLUDED.quantidade_atual, atualizado_em = NOW()`,
    [abrigo_id, tipo_recurso_id, quantidade_atual]
  )
}

async function main() {
  const client = await pool.connect()
  try {
    console.log('[seed] inicio')

    // 1. Usuarios
    const admin = await upsertUsuario(client, { ...SEED.admin, role: 'admin' })
    const coord = await upsertUsuario(client, { ...SEED.coord, role: 'coordenador' })
    const doador = await upsertUsuario(client, {
      ...SEED.doador,
      role: 'doador',
    })
    console.log('[seed] usuarios:', {
      admin: admin.email,
      coord: coord.email,
      doador: doador.email,
    })

    // 2. Abrigo demo do coordenador
    const abrigo = await upsertAbrigo(client, {
      nome: 'Abrigo Escola Esperança',
      coordenador_id: coord.id,
      localizacao: 'Rua das Flores 100, Bairro Centro',
      capacidade: 80,
    })
    console.log(
      `[seed] abrigo demo (${abrigo.atualizado ? 'atualizado' : 'criado'}): ${abrigo.id}`
    )

    // 3. Demografia agregada do abrigo
    const pessoas = [
      { categoria: 'crianca_0_3', qtd: 12 },
      { categoria: 'crianca_4_12', qtd: 8 },
      { categoria: 'adolescente', qtd: 5 },
      { categoria: 'adulto_h', qtd: 10 },
      { categoria: 'adulto_m', qtd: 14 },
      { categoria: 'idoso_h', qtd: 3 },
      { categoria: 'idoso_m', qtd: 5 },
    ]
    for (const p of pessoas) {
      await upsertPessoa(client, { abrigo_id: abrigo.id, ...p })
    }
    console.log('[seed] demografia: 7 categorias inseridas')

    // 4. Estoque inicial parcial — pra mostrar deficit calculado depois
    // Os ids vem da ordem de insercao em schema.sql, sao SERIAL.
    // 1 = Agua mineral 500ml, 4 = Sabonete, 11 = Fralda P
    const estoques = [
      { tipo_recurso_id: 1, quantidade_atual: 100 }, // Agua 500ml
      { tipo_recurso_id: 4, quantidade_atual: 5 }, // Sabonete
      { tipo_recurso_id: 11, quantidade_atual: 50 }, // Fralda P
    ]
    for (const e of estoques) {
      await upsertEstoque(client, { abrigo_id: abrigo.id, ...e })
    }
    console.log('[seed] estoque inicial: 3 itens')

    console.log('\n[seed] fim — credenciais:')
    console.log(`   admin   ${SEED.admin.email} / ${SEED.admin.senha}`)
    console.log(`   coord   ${SEED.coord.email} / ${SEED.coord.senha}`)
    console.log(`   doador  ${SEED.doador.email} / ${SEED.doador.senha}`)
  } catch (err) {
    console.error('[seed] erro:', err.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()
