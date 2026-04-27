export const CATEGORIA_VITIMA = {
  idoso_h: "Idoso (homem)",
  idoso_m: "Idosa (mulher)",
  adulto_h: "Adulto (homem)",
  adulto_m: "Adulta (mulher)",
  crianca_0_3: "Criança (0-3 anos)",
  crianca_4_12: "Criança (4-12 anos)",
  adolescente: "Adolescente",
}

export const CATEGORIA_VITIMA_OPTIONS = Object.entries(CATEGORIA_VITIMA).map(
  ([value, label]) => ({ value, label })
)

export const CATEGORIA_RECURSO = {
  hidratacao: "Hidratação",
  higiene: "Higiene",
  fraldas: "Fraldas",
  alimento_nao_perec: "Alimento não perecível",
  primeira_infancia: "Primeira infância",
  saude: "Saúde",
  vestuario: "Vestuário",
  dormir: "Dormir",
  limpeza: "Limpeza",
  emergencia: "Emergência",
  pets: "Pets",
}

export const CONDICAO_ESPECIAL = {
  diabetes: "Diabetes",
  cardiaco: "Cardíaco",
  gestante: "Gestante",
  bebe_lactente: "Bebê lactente",
  cadeirante: "Cadeirante",
  acamado: "Acamado",
  autista: "Autista",
  alergia_grave: "Alergia grave",
}

export const CONDICAO_ESPECIAL_OPTIONS = Object.entries(CONDICAO_ESPECIAL).map(
  ([value, label]) => ({ value, label })
)

export const STATUS_NECESSIDADE = {
  calculada: { label: "Calculada", tone: "muted" },
  aberta: { label: "Aberta", tone: "primary" },
  parcialmente_atendida: { label: "Parcial", tone: "warn" },
  atendida: { label: "Atendida", tone: "accent" },
  expirada: { label: "Expirada", tone: "destructive" },
}

export const STATUS_OFERTA = {
  ofertada: { label: "Ofertada", tone: "primary" },
  em_match: { label: "Em match", tone: "warn" },
  confirmada: { label: "Confirmada", tone: "accent" },
  entregue: { label: "Entregue", tone: "accent" },
  cancelada: { label: "Cancelada", tone: "muted" },
}

export const STATUS_MATCH = {
  proposto: { label: "Proposto", tone: "warn" },
  aceito: { label: "Aceito", tone: "primary" },
  em_entrega: { label: "Em entrega", tone: "warn" },
  recebido: { label: "Recebido", tone: "accent" },
  cancelado: { label: "Cancelado", tone: "muted" },
}

export const ROLE = {
  coordenador: "Coordenador de abrigo",
  doador: "Doador",
  admin: "Administrador",
}

export function rotaInicialPorRole(role) {
  if (role === "coordenador") return "/coordenador"
  if (role === "doador") return "/doador"
  if (role === "admin") return "/admin"
  return "/"
}
