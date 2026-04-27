import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useCatalogo } from "@/context/CatalogoContext"
import { formatarData, formatarRelativo } from "@/lib/formatters"
import { AppShell } from "@/components/AppShell"
import { StatusBadge } from "@/components/StatusBadge"
import { EmptyState } from "@/components/EmptyState"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function DoadorHome() {
  const { usuario } = useAuth()
  const { nomeRecurso } = useCatalogo()

  const [abrigosPub, setAbrigosPub] = useState(null)
  const [erroAbrigos, setErroAbrigos] = useState("")

  const [minhasOfertas, setMinhasOfertas] = useState(null)
  const [erroOfertas, setErroOfertas] = useState("")

  const [matches, setMatches] = useState(null)
  const [matchesIndisponivel, setMatchesIndisponivel] = useState(false)

  useEffect(() => {
    api
      .unauth.get("/publico/abrigos")
      .then((data) => setAbrigosPub(Array.isArray(data) ? data : []))
      .catch((err) => setErroAbrigos(err.message))
  }, [])

  const carregarMinhas = useCallback(async () => {
    try {
      const data = await api.get("/ofertas/minhas")
      setMinhasOfertas(Array.isArray(data) ? data : [])
      setErroOfertas("")
    } catch (err) {
      setErroOfertas(err.message)
      setMinhasOfertas([])
    }
  }, [])

  useEffect(() => {
    carregarMinhas()
  }, [carregarMinhas])

  const carregarMatches = useCallback(async () => {
    try {
      const data = await api.get("/matches/minhas")
      setMatches(Array.isArray(data) ? data : [])
      setMatchesIndisponivel(false)
    } catch (err) {
      if (err instanceof ApiError && err.status >= 500) {
        setMatchesIndisponivel(true)
      }
      setMatches([])
    }
  }, [])

  useEffect(() => {
    carregarMatches()
  }, [carregarMatches])

  const ofertasPorStatus = useMemo(() => {
    const grupos = {
      ativas: [],
      entregues: [],
      canceladas: [],
    }
    for (const o of minhasOfertas || []) {
      if (o.status === "entregue") grupos.entregues.push(o)
      else if (o.status === "cancelada") grupos.canceladas.push(o)
      else grupos.ativas.push(o)
    }
    return grupos
  }, [minhasOfertas])

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* HERO */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Olá, {usuario.nome.split(" ")[0]}!
            </h1>
            <p className="text-sm text-muted-foreground">
              Suas doações em um só lugar.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/doador/oferta">+ nova oferta</Link>
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Ofertas ativas
              </div>
              <div className="text-3xl font-semibold text-primary mt-1">
                {minhasOfertas?.length === undefined
                  ? "—"
                  : ofertasPorStatus.ativas.length}
              </div>
              <div className="text-xs text-muted-foreground">
                aguardando match ou em trânsito
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Doações entregues
              </div>
              <div className="text-3xl font-semibold text-accent mt-1">
                {minhasOfertas ? ofertasPorStatus.entregues.length : "—"}
              </div>
              <div className="text-xs text-muted-foreground">
                {ofertasPorStatus.entregues.length === 0
                  ? "Sua primeira está prestes a acontecer!"
                  : "Obrigado por ajudar."}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Matches em curso
              </div>
              <div className="text-3xl font-semibold text-warn-foreground mt-1">
                {matchesIndisponivel ? "—" : matches?.length ?? "—"}
              </div>
              <div className="text-xs text-muted-foreground">
                {matchesIndisponivel
                  ? "rota em construção"
                  : "ofertas casadas com necessidades"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TABS */}
        <Tabs defaultValue="necessidades">
          <TabsList>
            <TabsTrigger value="necessidades">Necessidades abertas</TabsTrigger>
            <TabsTrigger value="minhas">Minhas ofertas</TabsTrigger>
            <TabsTrigger value="abrigos">Abrigos com vagas</TabsTrigger>
            <TabsTrigger value="matches">Meus matches</TabsTrigger>
          </TabsList>

          <TabsContent value="necessidades" className="mt-4">
            <CardNecessidadesParaDoar
              minhasOfertas={minhasOfertas || []}
              nomeRecurso={nomeRecurso}
              onMatchCriado={async () => {
                await carregarMinhas()
                await carregarMatches()
              }}
            />
          </TabsContent>

          <TabsContent value="minhas" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Suas ofertas</CardTitle>
                <CardDescription>
                  Tudo que você cadastrou pra doar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {erroOfertas ? (
                  <Alert variant="destructive">
                    <AlertTitle>Erro ao carregar</AlertTitle>
                    <AlertDescription>{erroOfertas}</AlertDescription>
                  </Alert>
                ) : minhasOfertas === null ? (
                  <Skeleton className="h-32 w-full" />
                ) : minhasOfertas.length === 0 ? (
                  <EmptyState
                    titulo="Nenhuma oferta ainda"
                    descricao="Crie sua primeira oferta. Você decide o que doar e quando entregar."
                    acao={
                      <Button asChild>
                        <Link to="/doador/oferta">Criar primeira oferta</Link>
                      </Button>
                    }
                  />
                ) : (
                  <ul className="divide-y">
                    {minhasOfertas.map((o) => (
                      <li
                        key={o.id}
                        className="py-3 flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {o.tipo_nome || nomeRecurso(o.tipo_recurso_id)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {o.qtd_ofertada}{" "}
                            {o.unidade_medida ? `${o.unidade_medida} · ` : "· "}
                            entrega em {formatarData(o.data_entrega)}
                          </div>
                        </div>
                        <StatusBadge tipo="oferta" status={o.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="abrigos" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Abrigos cadastrados</CardTitle>
                <CardDescription>
                  Veja onde sua doação pode chegar. Lista pública.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {erroAbrigos ? (
                  <Alert variant="destructive">
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{erroAbrigos}</AlertDescription>
                  </Alert>
                ) : abrigosPub === null ? (
                  <Skeleton className="h-40 w-full" />
                ) : abrigosPub.length === 0 ? (
                  <EmptyState titulo="Nenhum abrigo no momento" />
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {abrigosPub.map((a) => {
                      const cap = a.capacidade ?? 0
                      const oc = a.ocupacao_atual ?? 0
                      const pct = cap > 0 ? (oc / cap) * 100 : 0
                      return (
                        <div
                          key={a.id}
                          className="rounded-lg border p-3 space-y-2"
                        >
                          <div className="font-medium text-sm">{a.nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.localizacao}
                          </div>
                          <Progress value={pct} className="h-1.5" />
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              {oc} de {cap}
                            </span>
                            <span className="text-accent font-medium">
                              {a.vagas ?? cap - oc} vagas
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Seus matches</CardTitle>
                <CardDescription>
                  Ofertas casadas com necessidades de abrigos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matchesIndisponivel ? (
                  <Alert>
                    <AlertTitle>Em construção</AlertTitle>
                    <AlertDescription>
                      A rota de matches está em desenvolvimento no backend.
                    </AlertDescription>
                  </Alert>
                ) : matches === null ? (
                  <Skeleton className="h-32 w-full" />
                ) : matches.length === 0 ? (
                  <EmptyState
                    titulo="Sem matches por enquanto"
                    descricao="Quando uma das suas ofertas for casada com a necessidade de um abrigo, ela aparece aqui."
                  />
                ) : (
                  <ul className="space-y-3">
                    {matches.map((m) => (
                      <ItemMatch
                        key={m.id}
                        match={m}
                        nomeRecurso={nomeRecurso}
                        onAtualizar={carregarMatches}
                      />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

function CardNecessidadesParaDoar({ minhasOfertas, nomeRecurso, onMatchCriado }) {
  const [necessidades, setNecessidades] = useState(null)
  const [erro, setErro] = useState("")
  const [propondo, setPropondo] = useState(null)

  const carregar = useCallback(async () => {
    try {
      const data = await api.unauth.get("/necessidades")
      const items = Array.isArray(data) ? data : data?.items || []
      setNecessidades(items)
      setErro("")
    } catch (err) {
      setErro(err.message)
      setNecessidades([])
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  // ofertas em status 'ofertada' indexadas por tipo_recurso_id
  const ofertasAtivasPorTipo = useMemo(() => {
    const map = {}
    for (const o of minhasOfertas) {
      if (o.status === "ofertada") {
        if (!map[o.tipo_recurso_id]) map[o.tipo_recurso_id] = []
        map[o.tipo_recurso_id].push(o)
      }
    }
    return map
  }, [minhasOfertas])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Necessidades abertas</CardTitle>
        <CardDescription>
          Quem precisa do que, agora. Você pode propor uma doação se já tem
          oferta deste recurso.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {erro ? (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        ) : necessidades === null ? (
          <Skeleton className="h-32 w-full" />
        ) : necessidades.length === 0 ? (
          <EmptyState
            titulo="Nenhuma necessidade aberta"
            descricao="Quando coordenadores recalcularem, as necessidades aparecem aqui."
          />
        ) : (
          <ul className="divide-y">
            {necessidades.map((n) => {
              const ofertasCompativeis =
                ofertasAtivasPorTipo[n.tipo_recurso_id] || []
              const podePropor = ofertasCompativeis.length > 0
              return (
                <li key={n.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {n.tipo_nome || nomeRecurso(n.tipo_recurso_id)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {n.abrigo_nome} · precisa {n.qtd_necessaria}
                      {n.unidade_medida ? ` ${n.unidade_medida}` : ""} · prazo{" "}
                      {formatarData(n.prazo)}
                      {n.qtd_em_entrega > 0 && (
                        <span className="text-accent ml-1">
                          · {n.qtd_em_entrega} a caminho
                        </span>
                      )}
                    </div>
                  </div>
                  {podePropor ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        setPropondo({
                          necessidade: n,
                          ofertas: ofertasCompativeis,
                        })
                      }
                    >
                      Propor doação
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      sem oferta compatível
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>

      <DialogProporMatch
        propondo={propondo}
        onClose={() => setPropondo(null)}
        onCriado={() => {
          setPropondo(null)
          carregar()
          onMatchCriado?.()
        }}
      />
    </Card>
  )
}

function DialogProporMatch({ propondo, onClose, onCriado }) {
  const [ofertaId, setOfertaId] = useState("")
  const [qtd, setQtd] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")

  useEffect(() => {
    if (propondo) {
      const padrao = propondo.ofertas[0]
      setOfertaId(padrao?.id || "")
      const max = Math.min(
        padrao?.qtd_ofertada || 0,
        propondo.necessidade.qtd_necessaria
      )
      setQtd(String(max))
      setErro("")
    }
  }, [propondo])

  if (!propondo) return null

  const ofertaSelecionada = propondo.ofertas.find((o) => o.id === ofertaId)
  const maxQtd = Math.min(
    ofertaSelecionada?.qtd_ofertada || 0,
    propondo.necessidade.qtd_necessaria
  )

  async function handleSalvar(e) {
    e.preventDefault()
    setErro("")
    setSalvando(true)
    try {
      await api.post("/matches", {
        oferta_id: ofertaId,
        necessidade_id: propondo.necessidade.id,
        qtd_casada: Number(qtd),
      })
      toast.success("Doação proposta! Aguarde o coordenador aceitar.")
      onCriado?.()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={!!propondo} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Propor doação</DialogTitle>
          <DialogDescription>
            Para {propondo.necessidade.abrigo_nome} ·{" "}
            {propondo.necessidade.tipo_nome ||
              `recurso #${propondo.necessidade.tipo_recurso_id}`}{" "}
            · precisa {propondo.necessidade.qtd_necessaria}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSalvar} className="space-y-4">
          {propondo.ofertas.length > 1 && (
            <div className="space-y-2">
              <Label>Qual das suas ofertas usar?</Label>
              <Select value={ofertaId} onValueChange={setOfertaId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {propondo.ofertas.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.qtd_ofertada} unidades · entrega{" "}
                      {formatarData(o.data_entrega)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="qtd-match">
              Quantidade a doar (máximo {maxQtd})
            </Label>
            <Input
              id="qtd-match"
              type="number"
              min={1}
              max={maxQtd}
              required
              value={qtd}
              onChange={(e) => setQtd(e.target.value)}
            />
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!ofertaId || !qtd || salvando}
            >
              {salvando ? "Propondo..." : "Propor doação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ItemMatch({ match, onAtualizar, nomeRecurso }) {
  const [updatingTo, setUpdatingTo] = useState(null)

  async function mudarStatus(novo) {
    setUpdatingTo(novo)
    try {
      await api.put(`/matches/${match.id}/status`, { status: novo })
      toast.success("Status atualizado.")
      await onAtualizar?.()
    } catch (err) {
      toast.error(err.message || "Não foi possível atualizar.")
    } finally {
      setUpdatingTo(null)
    }
  }

  const podeMarcarEmEntrega = match.status === "aceito"
  const podeCancelar = ["proposto", "aceito", "em_entrega"].includes(
    match.status
  )

  return (
    <li className="rounded-md border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium">
            {match.tipo_nome ||
              nomeRecurso?.(match.tipo_recurso_id) ||
              `Match #${match.id?.slice?.(0, 6)}`}
          </div>
          <div className="text-xs text-muted-foreground">
            {match.qtd_casada} unidade(s) ·{" "}
            {match.abrigo_nome ? `para ${match.abrigo_nome}` : "abrigo"} ·{" "}
            {formatarRelativo(match.criado_em)}
          </div>
        </div>
        <StatusBadge tipo="match" status={match.status} />
      </div>
      {(podeMarcarEmEntrega || podeCancelar) && (
        <div className="flex gap-2">
          {podeMarcarEmEntrega && (
            <Button
              size="sm"
              disabled={updatingTo !== null}
              onClick={() => mudarStatus("em_entrega")}
            >
              {updatingTo === "em_entrega"
                ? "Atualizando..."
                : "Marcar em entrega"}
            </Button>
          )}
          {podeCancelar && (
            <Button
              size="sm"
              variant="ghost"
              disabled={updatingTo !== null}
              onClick={() => mudarStatus("cancelado")}
            >
              {updatingTo === "cancelado" ? "Cancelando..." : "Cancelar"}
            </Button>
          )}
        </div>
      )}
    </li>
  )
}
