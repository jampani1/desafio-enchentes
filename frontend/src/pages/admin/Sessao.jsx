import { useEffect, useState } from "react"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { ROLE } from "@/lib/enums"
import { AppShell } from "@/components/AppShell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AdminSessao() {
  const { usuario } = useAuth()
  const [stats, setStats] = useState({
    abrigos: null,
    ofertas: null,
    tipos: null,
  })
  const [tiposIndisponivel, setTiposIndisponivel] = useState(false)

  useEffect(() => {
    api
      .get("/abrigos")
      .then((d) =>
        setStats((s) => ({ ...s, abrigos: Array.isArray(d) ? d.length : 0 }))
      )
      .catch(() => setStats((s) => ({ ...s, abrigos: 0 })))
    api
      .unauth.get("/ofertas")
      .then((d) =>
        setStats((s) => ({ ...s, ofertas: Array.isArray(d) ? d.length : 0 }))
      )
      .catch(() => setStats((s) => ({ ...s, ofertas: 0 })))
    api
      .unauth.get("/tipos-recurso")
      .then((d) =>
        setStats((s) => ({ ...s, tipos: Array.isArray(d) ? d.length : 0 }))
      )
      .catch((err) => {
        if (err instanceof ApiError && err.status >= 500) {
          setTiposIndisponivel(true)
        }
        setStats((s) => ({ ...s, tipos: 0 }))
      })
  }, [])

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Painel administrativo
          </h1>
          <p className="text-sm text-muted-foreground">
            Visão de leitura desta rodada. Mais ferramentas administrativas em
            breve.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessão</CardTitle>
            <CardDescription>Dados do administrador logado.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Nome</dt>
                <dd className="font-medium">{usuario.nome}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">E-mail</dt>
                <dd>{usuario.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Papel</dt>
                <dd>{ROLE[usuario.role] || usuario.role}</dd>
              </div>
              <div className="sm:col-span-3">
                <dt className="text-muted-foreground">ID</dt>
                <dd className="font-mono text-xs">{usuario.id}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard
            titulo="Abrigos"
            valor={stats.abrigos}
            sub="cadastrados na plataforma"
          />
          <StatCard
            titulo="Ofertas em aberto"
            valor={stats.ofertas}
            sub="em status ofertada"
          />
          <StatCard
            titulo="Tipos de recurso"
            valor={stats.tipos}
            sub={
              tiposIndisponivel
                ? "rota em construção"
                : "no catálogo"
            }
            indisponivel={tiposIndisponivel}
          />
        </div>
      </div>
    </AppShell>
  )
}

function StatCard({ titulo, valor, sub, indisponivel }) {
  return (
    <Card>
      <CardContent className="pt-5 space-y-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {titulo}
        </div>
        {valor === null && !indisponivel ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-semibold text-primary">
            {indisponivel ? "—" : valor}
          </div>
        )}
        <div className="text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  )
}
