import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { api } from "@/lib/api"

const CatalogoContext = createContext(null)

export function CatalogoProvider({ children }) {
  const [tipos, setTipos] = useState(null)
  const [erro, setErro] = useState("")

  const carregar = useCallback(async () => {
    setErro("")
    try {
      const data = await api.unauth.get("/tipos-recurso")
      setTipos(Array.isArray(data) ? data : [])
    } catch (err) {
      setErro(err.message)
      setTipos([])
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const porId = useMemo(() => {
    const m = new Map()
    for (const t of tipos || []) m.set(t.id, t)
    return m
  }, [tipos])

  const nomeRecurso = useCallback(
    (tipoId, fallback) => {
      const t = porId.get(Number(tipoId))
      if (t) return t.unidade_medida ? `${t.nome}` : t.nome
      return fallback || `Recurso #${tipoId}`
    },
    [porId]
  )

  const detalheRecurso = useCallback(
    (tipoId) => porId.get(Number(tipoId)) || null,
    [porId]
  )

  return (
    <CatalogoContext.Provider
      value={{
        tipos: tipos || [],
        carregando: tipos === null,
        erro,
        recarregar: carregar,
        nomeRecurso,
        detalheRecurso,
      }}
    >
      {children}
    </CatalogoContext.Provider>
  )
}

export function useCatalogo() {
  const ctx = useContext(CatalogoContext)
  if (!ctx) throw new Error("useCatalogo deve estar dentro de <CatalogoProvider>")
  return ctx
}
