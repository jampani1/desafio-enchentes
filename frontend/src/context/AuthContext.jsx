import { createContext, useContext, useState, useCallback } from "react"
import { api } from "@/lib/api"

const AuthContext = createContext(null)

function lerStorage() {
  const token = localStorage.getItem("token")
  const raw = localStorage.getItem("usuario")
  if (!token || !raw) return { usuario: null, token: null }
  try {
    return { usuario: JSON.parse(raw), token }
  } catch {
    return { usuario: null, token: null }
  }
}

export function AuthProvider({ children }) {
  const [{ usuario, token }, setEstado] = useState(lerStorage)

  const login = useCallback(async ({ email, senha }) => {
    const data = await api.unauth.post("/auth/login", { email, senha })
    localStorage.setItem("token", data.token)
    localStorage.setItem("usuario", JSON.stringify(data.usuario))
    setEstado({ usuario: data.usuario, token: data.token })
    return data.usuario
  }, [])

  const cadastrar = useCallback(async (dados) => {
    await api.unauth.post("/usuarios", dados)
    return await login({ email: dados.email, senha: dados.senha })
  }, [login])

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("usuario")
    localStorage.removeItem("abrigoAtivoId")
    setEstado({ usuario: null, token: null })
  }, [])

  const refresh = useCallback(async () => {
    try {
      const me = await api.get("/usuarios/me")
      localStorage.setItem("usuario", JSON.stringify(me))
      setEstado((s) => ({ ...s, usuario: me }))
      return me
    } catch (err) {
      if (err.status === 401) logout()
      throw err
    }
  }, [logout])

  return (
    <AuthContext.Provider
      value={{ usuario, token, login, cadastrar, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve estar dentro de <AuthProvider>")
  return ctx
}
