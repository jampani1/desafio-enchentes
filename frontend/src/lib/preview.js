// Tracking simples de visitas a previews. Conta localmente neste navegador
// e tenta avisar o backend (rota futura) — falha sem barulho se nao existir.

const BASE_URL = import.meta.env.VITE_API_URL

export const PREVIEW_ROLES = ["coordenador", "doador", "voluntario"]

function chave(role) {
  return `preview_views_${role}`
}

export function registrarPreview(role) {
  if (!PREVIEW_ROLES.includes(role)) return 0

  const k = chave(role)
  const n = Number(localStorage.getItem(k) || "0") + 1
  localStorage.setItem(k, String(n))

  // tenta logar no backend; ignora silenciosamente
  try {
    fetch(`${BASE_URL}/publico/preview-views/${role}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ts: new Date().toISOString() }),
    }).catch(() => {})
  } catch {
    // sem rede, sem problema
  }

  return n
}

export function obterPreviews() {
  return {
    coordenador: Number(localStorage.getItem(chave("coordenador")) || "0"),
    doador: Number(localStorage.getItem(chave("doador")) || "0"),
    voluntario: Number(localStorage.getItem(chave("voluntario")) || "0"),
  }
}

export function obterTotal() {
  const v = obterPreviews()
  return v.coordenador + v.doador + v.voluntario
}
