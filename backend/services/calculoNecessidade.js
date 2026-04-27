const pool = require('../db')

// Calcula necessidades de um abrigo a partir de:
// - composicao demografica (pessoa_abrigada)
// - regras de consumo por categoria (regra_consumo)
// - estoque atual (estoque)
// - prazo de projecao (default 7 dias)
//
// Funciona em transacao: expira necessidades antigas 'calculada'/'aberta' e
// insere as novas. Retorna array das necessidades criadas.
async function calcularNecessidades(abrigoId, prazoDias = 7) {
  //aqui abre a conexão e mantem, espera o begin, todas as ações no banco e depois de tudo certo literalmente commita
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. demografia agregada
    const { rows: pessoas } = await client.query(
      'SELECT categoria, qtd FROM pessoa_abrigada WHERE abrigo_id = $1',
      [abrigoId]
    )

    //puxar todas as regras de consumo (de uma vez) antes para calcular depois
    //mais simples que join pq tem poucas linhas, (otimizacao provavelmente)
    // 2. todas as regras de consumo
    const { rows: regras } = await client.query(
      'SELECT categoria_vitima, tipo_recurso_id, qtd_pessoa_dia FROM regra_consumo'
    )

    // 3. estoque atual do abrigo
    const { rows: estoqueRows } = await client.query(
      'SELECT tipo_recurso_id, quantidade_atual FROM estoque WHERE abrigo_id = $1',
      [abrigoId]
    )

    // 4. agregar projecao por tipo_recurso
    const projecao = new Map()
    //for aninhado porque passa cada categoria para cada tipo de pessoa (ex todos tem necessidade de agua, isso precisa ser SOMADO)
    for (const p of pessoas) {
      const regrasDaCat = regras.filter((r) => r.categoria_vitima === p.categoria)
      for (const r of regrasDaCat) {
        //number porque NUMERIC do postgres vem como string em js
        const proj = Number(p.qtd) * Number(r.qtd_pessoa_dia) * prazoDias
        projecao.set(r.tipo_recurso_id, (projecao.get(r.tipo_recurso_id) || 0) + proj)
      }
    }

    // map porque aceita numero como indice, mais facil de procurar ja que tipo_recurso_id
    const estoque = new Map(
      estoqueRows.map((e) => [e.tipo_recurso_id, Number(e.quantidade_atual)])
    )

    //só expira calculada e aberta, nao altera parcialmente_atendida por ja ter oferta aceita nem atendida/expirada (finalizadas)
    // 5. expirar necessidades anteriores 'calculada' ou 'aberta'
    await client.query(
      `UPDATE necessidade SET status = 'expirada'
       WHERE abrigo_id = $1 AND status IN ('calculada', 'aberta')`,
      [abrigoId]
    )

    // 6. calcular deficit e inserir novas necessidades
    const prazoData = new Date()
    prazoData.setDate(prazoData.getDate() + prazoDias)
    const prazoStr = prazoData.toISOString().split('T')[0]

    const necessidadesCriadas = []
    for (const [tipoId, proj] of projecao) {
      const atual = estoque.get(tipoId) || 0
      //Math.ceil arredonda pra cima
      const deficit = Math.ceil(proj - atual)
      // se o deficit for maior, ai precisa (tem necessidade) se nao <= 0 tem estoque e sem necessidade
      if (deficit > 0) {
        const { rows } = await client.query(
          `INSERT INTO necessidade (abrigo_id, tipo_recurso_id, qtd_necessaria, prazo, status)
           VALUES ($1, $2, $3, $4, 'aberta')
           RETURNING *`,
          [abrigoId, tipoId, deficit, prazoStr]
        )
        //returning * faz o INSERT linha criada com uuid status e calculada_em
        necessidadesCriadas.push(rows[0])
      }
    }

    // se deu tudo certo acima > COMMITA
    await client.query('COMMIT')
    return necessidadesCriadas
    //se algo der err > ROLLBACK faz com que necessidade existente nao seja perdida
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

module.exports = { calcularNecessidades }
