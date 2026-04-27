import { Routes, Route, Navigate } from "react-router-dom"
import { RequireAuth } from "@/routes/RequireAuth"
import { Landing } from "@/pages/public/Landing"
import { Login } from "@/pages/public/Login"
import { Cadastro } from "@/pages/public/Cadastro"
import { CoordenadorDashboard } from "@/pages/coordenador/Dashboard"
import { AbrigoForm } from "@/pages/coordenador/AbrigoForm"
import { AbrigoGestao } from "@/pages/coordenador/AbrigoGestao"
import { DoadorHome } from "@/pages/doador/Home"
import { NovaOferta } from "@/pages/doador/NovaOferta"
import { AdminSessao } from "@/pages/admin/Sessao"

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      <Route
        path="/coordenador"
        element={
          <RequireAuth allow={["coordenador"]}>
            <CoordenadorDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/coordenador/abrigos/novo"
        element={
          <RequireAuth allow={["coordenador"]}>
            <AbrigoForm modo="criar" />
          </RequireAuth>
        }
      />
      <Route
        path="/coordenador/abrigos/:id/editar"
        element={
          <RequireAuth allow={["coordenador"]}>
            <AbrigoForm modo="editar" />
          </RequireAuth>
        }
      />
      <Route
        path="/coordenador/abrigos/:id"
        element={
          <RequireAuth allow={["coordenador"]}>
            <AbrigoGestao />
          </RequireAuth>
        }
      />

      <Route
        path="/doador"
        element={
          <RequireAuth allow={["doador"]}>
            <DoadorHome />
          </RequireAuth>
        }
      />
      <Route
        path="/doador/oferta"
        element={
          <RequireAuth allow={["doador"]}>
            <NovaOferta />
          </RequireAuth>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireAuth allow={["admin"]}>
            <AdminSessao />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
