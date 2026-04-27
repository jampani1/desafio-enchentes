import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import {
  CATEGORIA_VITIMA,
  CONDICAO_ESPECIAL,
} from "@/lib/enums"
import { formatarData, diasAteHoje } from "@/lib/formatters"
import { AppShell } from "@/components/AppShell"
import { EmptyState } from "@/components/EmptyState"
import { StatusBadge } from "@/components/StatusBadge"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

const STATUS_INDICANDO_CHEGADA = ["aceito", "em_entrega"]

export function CoordenadorDashboard() {
  const { usuario } = useAuth()

  const [abrigos, setAbrigos] = useState(null)
  const [erroAbrigos, setErroAbrigos] = useState("")

  const [abrigoAtivoId, setAbrigoAtivoId] = useState(
    () => localStorage.getItem("abrigoAtivoId") || ""
  )

  const [pessoas, setPessoas] = useState(null)
  const [casos, setCasos] = useState(null)
  const [necessidades, setNecessidades] = useState(null)
  const [matches, setMatches] = useState(null)

  const [pessoasIndisponivel, setPessoasIndisponivel] = useState(false)
  const [casosIndisponivel, setCasosIndisponivel] = useState(false)
  const [necessidadesIndisponivel, setNecessidadesIndisponivel] = useState(false)
  const [matchesIndisponivel, setMatchesIndisponivel] = useState(false)

  const [recalcOpen, setRecalcOpen] = useState(false)
  const [recalcLoading, setRecalcLoading] = useState(false)

  // 1. carregar abrigos do coordenador
  useEffect(() => {
    api
      .get("/abrigos")
      .then((data) => {
        const lista = (Array.isArray(data) ? data : []).filter(
          (a) => a.coordenador_id === usuario.id
        )
        setAbrigos(lista)
        if (lista.length > 0) {
          const valido = lista.find((a) => a.id === abrigoAtivoId)
          const escolhido = valido?.id || lista[0].id
          setAbrigoAtivoId(escolhido)
          localStorage.setItem("abrigoAtivoId", escolhido)
        }
      })
      .catch((err) => setErroAbrigos(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario.id])

  const abrigoAtivo = useMemo(
    () => abrigos?.find((a) => a.id === abrigoAtivoId),
    [abrigos, abrigoAtivoId]
  )

  // 2. carregar dados do abrigo ativo
  const carregarDadosAbrigo = useCallback(async (idAbrigo) => {
    setPessoas(null)
    setCasos(null)
    setNecessidades(null)
    setPessoasIndisponivel(false)
    setCasosIndisponivel(false)
    setNecessidadesIndisponivel(false)

    // pessoas (rota TODO no backend)
    try {
      const data = await api.get(`/abrigos/${idAbrigo}/pessoas`)
      setPessoas(Array.isArray(data) ? data : [])
    } catch (err) {
      if (err instanceof ApiError && err.status >= 500) {
        setPessoasIndisponivel(true)
      } else if (err.status === 404) {
        setPessoas([])
      } else {
        setPessoas([])
      }
    }

    // casos (TODO; tem auth ehDonoOuAdmin)
    try {
      const data = await api.get(`/abrigos/${idAbrigo}/casos`)
      setCasos(Array.isArray(data) ? data : [])
    } catch (err) {
      if (err instanceof ApiError && err.status >= 500) {
        setCasosIndisponivel(true)
      } else {
        setCasos([])
      }
    }

    // necessidades — endpoint listagem ainda não existe; tentamos rota provável
    try {
      const data = await api.get(`/necessidades?abrigoId=${idAbrigo}`)
      setNecessidades(
        Array.isArray(data) ? data : data?.necessidades || []
      )
    } catch {
      setNecessidadesIndisponivel(true)
    }
  }, [])

  useEffect(() => {
    if (!abrigoAtivoId) return
    carregarDadosAbrigo(abrigoAtivoId)
  }, [abrigoAtivoId, carregarDadosAbrigo])

  // 3. carregar matches do coordenador
  useEffect(() => {
    api
      .get("/matches/minhas")
      .then((data) => setMatches(Array.isArray(data) ? data : []))
      .catch(() => setMatchesIndisponivel(true))
  }, [])

  // métricas derivadas
  const totalPessoas = useMemo(
    () => (pessoas || []).reduce((acc, p) => acc + Number(p.qtd || 0), 0),
    [pessoas]
  )
  const totalCasos = (casos || []).length
  const necessidadesAbertas = useMemo(
    () =>
      (necessidades || []).filter(
        (n) => n.status === "aberta" || n.status === "calculada"
      ),
    [necessidades]
  )
  const matchesChegando = useMemo(
    () =>
      (matches || []).filter((m) =>
        STATUS_INDICANDO_CHEGADA.includes(m.status)
      ),
    [matches]
  )
  const necessidadesUrgentes = useMemo(
    () =>
      necessidadesAbertas.filter((n) => {
        const d = diasAteHoje(n.prazo)
        return d != null && d <= 3
      }),
    [necessidadesAbertas]
  )

  async function handleRecalcular() {
    if (!abrigoAtivoId) return
    setRecalcLoading(true)
    try {
      const data = await api.post(
        `/necessidades/calcular/${abrigoAtivoId}`,
        {}
      )
      setNecessidades(data?.necessidades || [])
      setNecessidadesIndisponivel(false)
      toast.success(
        `Necessidades recalculadas: ${data?.total ?? 0} item(s).`
      )
      setRecalcOpen(false)
    } catch (err) {
      toast.error(err.message || "Não foi possível recalcular.")
    } finally {
      setRecalcLoading(false)
    }
  }

  // STATES DE TELA INICIAIS

  if (erroAbrigos) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar seus abrigos</AlertTitle>
            <AlertDescription>{erroAbrigos}</AlertDescription>
          </Alert>
        </div>
      </AppShell>
    )
  }

  if (abrigos === null) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-72" />
        </div>
      </AppShell>
    )
  }

  if (abrigos.length === 0) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-4 py-16">
          <Card>
            <CardContent className="pt-10 pb-10">
              <EmptyState
                icone={<Logo size={48} />}
                titulo="Você ainda não tem abrigos cadastrados"
                descricao="Cadastre seu primeiro abrigo pra começar a registrar pessoas, estoque e calcular necessidades."
                acao={
                  <Button asChild size="lg">
                    <Link to="/coordenador/abrigos/novo">
                      Cadastrar abrigo
                    </Link>
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Painel do coordenador
            </h1>
            <p className="text-sm text-muted-foreground">
              Olá, {usuario.nome.split(" ")[0]}. Aqui está como o seu abrigo
              está agora.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={abrigoAtivoId}
              onValueChange={(v) => {
                setAbrigoAtivoId(v)
                localStorage.setItem("abrigoAtivoId", v)
              }}
            >
              <SelectTrigger className="w-65">
                <SelectValue placeholder="Selecione um abrigo" />
              </SelectTrigger>
              <SelectContent>
                {abrigos.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild variant="outline">
              <Link to="/coordenador/abrigos/novo">+ abrigo</Link>
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-4 gap-4">
          <KpiCard
            titulo="Pessoas abrigadas"
            valor={totalPessoas}
            sub={`de ${abrigoAtivo?.capacidade ?? 0} de capacidade`}
            indisponivel={pessoasIndisponivel}
          >
            {abrigoAtivo?.capacidade > 0 && !pessoasIndisponivel && (
              <Progress
                value={Math.min(
                  100,
                  (totalPessoas / abrigoAtivo.capacidade) * 100
                )}
                className="h-1.5"
              />
            )}
          </KpiCard>

          <KpiCard
            titulo="Casos especiais"
            valor={totalCasos}
            sub={
              totalCasos === 0
                ? "nenhum registrado"
                : `${totalCasos} pessoa(s) com necessidades especiais`
            }
            tom="special"
            indisponivel={casosIndisponivel}
          />

          <KpiCard
            titulo="Necessidades abertas"
            valor={necessidadesAbertas.length}
            sub={
              necessidadesUrgentes.length > 0
                ? `${necessidadesUrgentes.length} com prazo < 3 dias`
                : "nenhuma urgente"
            }
            tom={necessidadesUrgentes.length > 0 ? "destructive" : "primary"}
            indisponivel={necessidadesIndisponivel}
          />

          <KpiCard
            titulo="Doações chegando"
            valor={matchesChegando.length}
            sub={
              matchesChegando.length === 0
                ? "nenhuma em trânsito"
                : "aguardando recebimento"
            }
            tom="accent"
            indisponivel={matchesIndisponivel}
          />
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid lg:grid-cols-5 gap-4">
          {/* COLUNA ESQUERDA */}
          <div className="lg:col-span-3 space-y-4">
            <CardNecessidades
              indisponivel={necessidadesIndisponivel}
              necessidades={necessidadesAbertas}
              abrigoId={abrigoAtivoId}
              onRecalcular={() => setRecalcOpen(true)}
            />

            <CardComposicaoDemografica
              indisponivel={pessoasIndisponivel}
              pessoas={pessoas || []}
              total={totalPessoas}
              abrigoId={abrigoAtivoId}
            />
          </div>

          {/* COLUNA DIREITA */}
          <div className="lg:col-span-2 space-y-4">
            <CardAlertas
              urgentes={necessidadesUrgentes}
              casos={casos || []}
              casosIndisponivel={casosIndisponivel}
            />

            <CardOfertasChegando
              indisponivel={matchesIndisponivel}
              matches={matchesChegando}
              onAtualizado={async () => {
                try {
                  const data = await api.get("/matches/minhas")
                  setMatches(Array.isArray(data) ? data : [])
                } catch {
                  // mantém estado anterior
                }
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gestão do abrigo</CardTitle>
                <CardDescription>
                  Atualize pessoas, casos especiais e estoque.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button asChild variant="default" className="w-full">
                  <Link to={`/coordenador/abrigos/${abrigoAtivoId}`}>
                    Abrir gestão completa
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setRecalcOpen(true)}
                >
                  Recalcular necessidades
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                >
                  <Link
                    to={`/coordenador/abrigos/${abrigoAtivoId}/editar`}
                  >
                    Editar dados do abrigo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* DIALOG RECALCULAR */}
      <Dialog open={recalcOpen} onOpenChange={setRecalcOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recalcular necessidades</DialogTitle>
            <DialogDescription>
              O sistema vai projetar o consumo dos próximos 7 dias com base nas
              pessoas e estoque atuais. Necessidades anteriores não atendidas
              serão marcadas como expiradas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRecalcOpen(false)}
              disabled={recalcLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleRecalcular} disabled={recalcLoading}>
              {recalcLoading ? "Calculando..." : "Recalcular agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

function KpiCard({ titulo, valor, sub, tom = "primary", indisponivel, children }) {
  const cores = {
    primary: "text-primary",
    accent: "text-accent",
    destructive: "text-destructive",
    special: "text-special",
  }
  return (
    <Card>
      <CardContent className="pt-5 space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {titulo}
        </div>
        {indisponivel ? (
          <div className="text-sm text-muted-foreground italic">
            em construção
          </div>
        ) : (
          <>
            <div className={`text-3xl font-semibold ${cores[tom]}`}>
              {valor}
            </div>
            <div className="text-xs text-muted-foreground">{sub}</div>
            {children}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function CardNecessidades({ necessidades, indisponivel, abrigoId, onRecalcular }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Necessidades ativas</CardTitle>
          <CardDescription>
            O que falta para os próximos dias.
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={onRecalcular}>
          Recalcular
        </Button>
      </CardHeader>
      <CardContent>
        {indisponivel ? (
          <Alert>
            <AlertTitle>Listagem em construção</AlertTitle>
            <AlertDescription>
              A rota de listagem de necessidades ainda está em desenvolvimento
              no backend. Use "Recalcular" pra gerar a projeção mais recente.
            </AlertDescription>
          </Alert>
        ) : necessidades.length === 0 ? (
          <EmptyState
            titulo="Sem necessidades abertas"
            descricao="Recalcule pra projetar consumo dos próximos dias."
            acao={
              <Button onClick={onRecalcular} variant="default" size="sm">
                Recalcular agora
              </Button>
            }
          />
        ) : (
          <ul className="divide-y">
            {necessidades.slice(0, 8).map((n) => (
              <li key={n.id} className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {n.tipo_nome || `Recurso #${n.tipo_recurso_id}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Precisa de {n.qtd_necessaria} · prazo{" "}
                    {formatarData(n.prazo)}
                  </div>
                </div>
                <StatusBadge tipo="necessidade" status={n.status} />
              </li>
            ))}
            {necessidades.length > 8 && (
              <li className="py-3 text-center">
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/coordenador/abrigos/${abrigoId}`}>
                    Ver todas ({necessidades.length})
                  </Link>
                </Button>
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function CardComposicaoDemografica({ pessoas, total, indisponivel, abrigoId }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Composição demográfica</CardTitle>
        <CardDescription>Pessoas abrigadas por categoria.</CardDescription>
      </CardHeader>
      <CardContent>
        {indisponivel ? (
          <Alert>
            <AlertTitle>Em construção</AlertTitle>
            <AlertDescription>
              A gestão de pessoas abrigadas está sendo finalizada no backend.
            </AlertDescription>
          </Alert>
        ) : pessoas.length === 0 ? (
          <EmptyState
            titulo="Nenhuma pessoa registrada"
            descricao="Cadastre as pessoas abrigadas pra que o sistema calcule necessidades."
            acao={
              <Button asChild size="sm">
                <Link to={`/coordenador/abrigos/${abrigoId}`}>
                  Cadastrar pessoas
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {pessoas.map((p) => {
              const pct = total > 0 ? (Number(p.qtd) / total) * 100 : 0
              return (
                <div key={p.categoria} className="space-y-1">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-foreground">
                      {CATEGORIA_VITIMA[p.categoria] || p.categoria}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {p.qtd}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CardAlertas({ urgentes, casos, casosIndisponivel }) {
  const itens = []

  urgentes.forEach((n) => {
    itens.push({
      tom: "destructive",
      titulo: `Prazo apertado: ${n.tipo_nome || `recurso #${n.tipo_recurso_id}`}`,
      texto: `Faltam ${n.qtd_necessaria} unidade(s) até ${formatarData(n.prazo)}.`,
    })
  })

  if (!casosIndisponivel) {
    casos.slice(0, 3).forEach((c) => {
      itens.push({
        tom: "special",
        titulo: `Caso especial: ${CONDICAO_ESPECIAL[c.condicao] || c.condicao}`,
        texto: c.observacao || "Sem observação.",
      })
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Alertas</CardTitle>
        <CardDescription>
          O que merece atenção imediata.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {itens.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum alerta no momento.
          </p>
        ) : (
          itens.map((it, i) => (
            <AlertaItem
              key={i}
              tom={it.tom}
              titulo={it.titulo}
              texto={it.texto}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}

function AlertaItem({ tom, titulo, texto }) {
  const classes = {
    destructive: "border-destructive/40 bg-destructive/10 text-destructive",
    warn: "border-warn/40 bg-warn/15 text-warn-foreground",
    special: "border-special/40 bg-special/10 text-special",
  }
  return (
    <div className={`rounded-lg border p-3 ${classes[tom] || ""}`}>
      <div className="text-sm font-medium">{titulo}</div>
      <div className="text-xs mt-0.5 opacity-90">{texto}</div>
    </div>
  )
}

function CardOfertasChegando({ matches, indisponivel, onAtualizado }) {
  const [updatingId, setUpdatingId] = useState(null)

  async function marcarRecebido(id) {
    setUpdatingId(id)
    try {
      await api.put(`/matches/${id}/status`, { status: "recebido" })
      toast.success("Doação registrada como recebida.")
      await onAtualizado?.()
    } catch (err) {
      toast.error(err.message || "Não foi possível atualizar.")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Doações chegando</CardTitle>
        <CardDescription>
          Matches aceitos e em entrega.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {indisponivel ? (
          <Alert>
            <AlertTitle>Em construção</AlertTitle>
            <AlertDescription>
              A rota de matches está em desenvolvimento no backend.
            </AlertDescription>
          </Alert>
        ) : matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma doação a caminho agora.
          </p>
        ) : (
          <ul className="space-y-3">
            {matches.map((m) => (
              <li
                key={m.id}
                className="rounded-md border p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {m.tipo_nome || `Recurso #${m.oferta_id?.slice?.(0, 6)}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {m.qtd_casada} unidade(s)
                    </div>
                  </div>
                  <StatusBadge tipo="match" status={m.status} />
                </div>
                <Separator />
                <Button
                  size="sm"
                  variant="default"
                  className="w-full"
                  disabled={updatingId === m.id}
                  onClick={() => marcarRecebido(m.id)}
                >
                  {updatingId === m.id
                    ? "Atualizando..."
                    : "Marcar como recebido"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
