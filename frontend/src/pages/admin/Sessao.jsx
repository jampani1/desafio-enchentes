import { useEffect, useState } from "react"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { ROLE } from "@/lib/enums"
import { obterPreviews, obterTotal } from "@/lib/preview"
import { AppShell } from "@/components/AppShell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function AdminSessao() {
  const { usuario } = useAuth()
  const [stats, setStats] = useState({
    abrigos: null,
    ofertas: null,
    tipos: null,
  })
  const [tiposIndisponivel, setTiposIndisponivel] = useState(false)
  const [previews] = useState(obterPreviews)
  const [previewsTotal] = useState(obterTotal)
  // contagem global vinda do backend (preview_view table)
  const [globalPreviews, setGlobalPreviews] = useState(null)

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
    // contagem global de previews — falha silenciosa se rota indisponivel
    api
      .unauth.get("/publico/preview-views")
      .then(setGlobalPreviews)
      .catch(() => setGlobalPreviews(null))
  }, [])

  // helper: pega contagem global por role, ou 0 se ainda nao carregou
  const globalCount = (role) => {
    if (!globalPreviews) return null
    return globalPreviews.items.find((i) => i.role === role)?.count ?? 0
  }

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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acessos a previews</CardTitle>
            <CardDescription>
              Quantas vezes os modos demo foram abertos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Global (todos os navegadores) */}
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Global (todos os usuários)
              </div>
              <div className="grid sm:grid-cols-4 gap-4">
                <PreviewStat
                  titulo="Coordenador"
                  valor={globalCount("coordenador")}
                  tom="primary"
                />
                <PreviewStat
                  titulo="Doador"
                  valor={globalCount("doador")}
                  tom="accent"
                />
                <PreviewStat
                  titulo="Voluntário"
                  valor={globalCount("voluntario")}
                  tom="special"
                />
                <PreviewStat
                  titulo="Total"
                  valor={globalPreviews?.total ?? null}
                  tom="muted"
                />
              </div>
            </div>

            {/* Local (este navegador) */}
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Neste navegador
              </div>
              <div className="grid sm:grid-cols-4 gap-4">
                <PreviewStat
                  titulo="Coordenador"
                  valor={previews.coordenador}
                  tom="primary"
                />
                <PreviewStat
                  titulo="Doador"
                  valor={previews.doador}
                  tom="accent"
                />
                <PreviewStat
                  titulo="Voluntário"
                  valor={previews.voluntario}
                  tom="special"
                />
                <PreviewStat
                  titulo="Total"
                  valor={previewsTotal}
                  tom="muted"
                />
              </div>
            </div>

            {globalPreviews === null && (
              <Alert>
                <AlertTitle>Contagem global indisponível</AlertTitle>
                <AlertDescription>
                  Não consegui ler{" "}
                  <code className="text-xs">GET /publico/preview-views</code> —
                  exibindo só os números deste navegador.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function PreviewStat({ titulo, valor, tom = "primary" }) {
  const cores = {
    primary: "text-primary",
    accent: "text-accent",
    special: "text-special",
    muted: "text-foreground",
  }
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {titulo}
      </div>
      <div className={`text-2xl font-semibold tabular-nums ${cores[tom]}`}>
        {valor === null || valor === undefined ? (
          <Skeleton className="h-7 w-10 inline-block" />
        ) : (
          valor
        )}
      </div>
    </div>
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
