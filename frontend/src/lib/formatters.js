import { format, parseISO, formatDistanceToNow, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"

export function formatarData(iso) {
  if (!iso) return "-"
  try {
    const d = typeof iso === "string" ? parseISO(iso) : iso
    return format(d, "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return "-"
  }
}

export function formatarDataHora(iso) {
  if (!iso) return "-"
  try {
    const d = typeof iso === "string" ? parseISO(iso) : iso
    return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return "-"
  }
}

export function formatarRelativo(iso) {
  if (!iso) return "-"
  try {
    const d = typeof iso === "string" ? parseISO(iso) : iso
    return formatDistanceToNow(d, { locale: ptBR, addSuffix: true })
  } catch {
    return "-"
  }
}

export function diasAteHoje(iso) {
  if (!iso) return null
  try {
    const d = typeof iso === "string" ? parseISO(iso) : iso
    return differenceInDays(d, new Date())
  } catch {
    return null
  }
}

export function formatarQtd(n, unidade) {
  if (n == null) return "-"
  const num = typeof n === "string" ? Number(n) : n
  if (Number.isNaN(num)) return "-"
  const formatado = num.toLocaleString("pt-BR")
  return unidade ? `${formatado} ${unidade}` : formatado
}

export function iniciaisDoNome(nome) {
  if (!nome) return "?"
  const partes = nome.trim().split(/\s+/)
  const primeiras = (partes[0] || "").charAt(0)
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : ""
  return (primeiras + ultima).toUpperCase()
}

export function capitalizar(s) {
  if (!s) return ""
  return s.charAt(0).toUpperCase() + s.slice(1)
}
