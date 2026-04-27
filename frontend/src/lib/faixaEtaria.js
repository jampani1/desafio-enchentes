// Agrupa as categorias de pessoa abrigada (categoria_vitima do backend) por
// fase da vida, com paleta de tons compativel com Acolhida.

export const GRUPOS_FAIXA_ETARIA = [
  {
    id: "crianca",
    label: "Crianças",
    descricao: "0 a 12 anos",
    tom: "warn",
    categorias: [
      {
        value: "crianca_0_3",
        label: "0 a 3 anos",
        subtitulo: "lactente / primeira infância",
      },
      {
        value: "crianca_4_12",
        label: "4 a 12 anos",
        subtitulo: "infância",
      },
    ],
  },
  {
    id: "adolescente",
    label: "Adolescentes",
    descricao: "13 a 17 anos",
    tom: "primary",
    categorias: [
      {
        value: "adolescente",
        label: "Adolescente",
        subtitulo: "13 a 17 anos",
      },
    ],
  },
  {
    id: "adulto",
    label: "Adultos",
    descricao: "18 a 59 anos",
    tom: "accent",
    categorias: [
      {
        value: "adulto_h",
        label: "Homem adulto",
        subtitulo: "18 a 59 anos",
      },
      {
        value: "adulto_m",
        label: "Mulher adulta",
        subtitulo: "18 a 59 anos",
      },
    ],
  },
  {
    id: "idoso",
    label: "Idosos",
    descricao: "60+ anos",
    tom: "special",
    categorias: [
      {
        value: "idoso_h",
        label: "Homem idoso",
        subtitulo: "60+ anos",
      },
      {
        value: "idoso_m",
        label: "Mulher idosa",
        subtitulo: "60+ anos",
      },
    ],
  },
]

export const GRUPO_POR_CATEGORIA = {}
GRUPOS_FAIXA_ETARIA.forEach((g) => {
  g.categorias.forEach((c) => {
    GRUPO_POR_CATEGORIA[c.value] = {
      grupoId: g.id,
      grupoLabel: g.label,
      tom: g.tom,
      categoria: c,
    }
  })
})

export function rotuloAmigavel(categoriaValue) {
  const m = GRUPO_POR_CATEGORIA[categoriaValue]
  if (!m) return categoriaValue
  return `${m.grupoLabel} · ${m.categoria.label}`
}
