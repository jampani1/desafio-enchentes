const express = require('express')
const Joi = require('joi')
const pool = require('../db')
const { authRequired, hasRole } = require('../middlewares/auth')
const { calcularNecessidades } = require('../services/calculoNecessidade')

const router = express.Router()

const calcSchema = Joi.object({
  prazoDias: Joi.number().integer().min(1).max(365).default(7),
})

/* 
    criar um wrapper para calcular a necessidade com as validações
    da a possibilidade de automatizar os calculos sem ninguem
    precisar "solicitar" via cron job - service reusável

    a regra de calculo esta isolada em um service, atual rota eh
    so um adaptador
*/

//GET /necessidades?page=1&limit=20&status=aberta

// router.get('/necessidades?page=1&limit=20&status=aberta', async (req, res) => {
//     Response: 
//     {
//         "total":
//     }
// }))

//POST /necessidade/calcular/:abrigoId

router.post('/calcular/:abrigoId', authRequired, hasRole('coordenador', 'admin'), async (req, res) => {
  // 1. validar req.body com calcSchema
  const { error, value } = calcSchema.validate(req.body)
    if (error) {
  return res.status(400).json({ erro: error.details[0].message })
}
  // 2. checar ownership: se NÃO for admin - query que busca de qual abrigo eh o coordenador que faz a solicitacao
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
  // 3. try/catch chamando calcularNecessidades(abrigoId, prazoDias)
  try {
    const necessidades = await calcularNecessidades(req.params.abrigoId, value.prazoDias)
    // retornar total (com length) permite frontend usar esse numero sem calcular
      // 4. retornar 201 com { total: array.length, necessidades: array }
    res.status(201).json({ total: necessidades.length, necessidades })
    } catch (err) {
        res.status(500).json({ erro: err.message })
    }

})

module.exports = router