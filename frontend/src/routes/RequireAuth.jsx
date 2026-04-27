import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { rotaInicialPorRole } from "@/lib/enums"

export function RequireAuth({ allow, children }) {
  const { usuario } = useAuth()
  const location = useLocation()

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allow && !allow.includes(usuario.role)) {
    return <Navigate to={rotaInicialPorRole(usuario.role)} replace />
  }

  return children
}
