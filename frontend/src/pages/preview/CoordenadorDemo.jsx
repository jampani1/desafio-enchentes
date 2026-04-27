import { useEffect, useState } from "react"
import { toast } from "sonner"
import { addDays, format } from "date-fns"
import { CATEGORIA_VITIMA, CONDICAO_ESPECIAL } from "@/lib/enums"
import { formatarData } from "@/lib/formatters"
import { registrarPreview } from "@/lib/preview"
import { PreviewShell } from "@/components/PreviewShell"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const USUARIO_FAKE = {
  nome: "Ana Cordeiro",
  descricao: "Coordenadora · Demo",
  iniciais: "AC",
}

const ABRIGO = {
  nome: "Escola Municipal Esperança",
  localizacao: "Rua das Flores, 230 — Centro",
  capacidade: 80,
}

const PESSOAS = [
  { categoria: "crianca_0_3", qtd: 3 },
  { categoria: "crianca_4_12", qtd: 5 },
  { categoria: "adolescente", qtd: 2 },
  { categoria: "adulto_h", qtd: 4 },
  { categoria: "adulto_m", qtd: 6 },
  { categoria: "idoso_h", qtd: 1 },
  { categoria: "idoso_m", qtd: 2 },
]

const CASOS = [
  { id: "c1", condicao: "diabetes", observacao: "Insulino-dependente, dose lenta" },
  { id: "c2", condicao: "gestante", observacao: "33 semanas, próxima do parto" },
  { id: "c3", condicao: "cadeirante", observacao: "Precisa de rampa para o banheiro" },
]

function necessidadesMock() {
  const hoje = new Date()
  return [
    {
      id: "n1",
      tipo_nome: "Água mineral 500ml",
      unidade_medida: "un",
      qtd_necessaria: 173,
      prazo: format(addDays(hoje, 7), "yyyy-MM-dd"),
      status: "aberta",
    },
    {
      id: "n2",
      tipo_nome: "Fralda infantil M",
      unidade_medida: "un",
      qtd_necessaria: 45,
      prazo: format(addDays(hoje, 2), "yyyy-MM-dd"),
      status: "aberta",
    },
    {
      id: "n3",
      tipo_nome: "Fralda geriátrica G",
      unidade_medida: "un",
      qtd_necessaria: 28,
      prazo: format(addDays(hoje, 5), "yyyy-MM-dd"),
      status: "aberta",
    },
    {
      id: "n4",
      tipo_nome: "Sabonete em barra",
      unidade_medida: "un",
      qtd_necessaria: 60,
      prazo: format(addDays(hoje, 10), "yyyy-MM-dd"),
      status: "aberta",
    },
    {
      id: "n5",
      tipo_nome: "Cobertor",
      unidade_medida: "un",
      qtd_necessaria: 12,
      prazo: format(addDays(hoje, 4), "yyyy-MM-dd"),
      status: "parcialmente_atendida",
    },
    {
      id: "n6",
      tipo_nome: "Insulina lenta",
      unidade_medida: "frasco",
      qtd_necessaria: 1,
      prazo: format(addDays(hoje, 1), "yyyy-MM-dd"),
      status: "aberta",
    },
  ]
}

const MATCHES = [
  {
    id: "m1",
    tipo_nome: "Cobertor",
    qtd_casada: 6,
    status: "em_entrega",
    abrigo_nome: ABRIGO.nome,
  },
  {
    id: "m2",
    tipo_nome: "Sabonete em barra",
    qtd_casada: 30,
    status: "aceito",
    abrigo_nome: ABRIGO.nome,
  },
]

export function CoordenadorDemo() {
  const [necessidades] = useState(necessidadesMock)
  const [agora] = useState(() => Date.now())
  const totalPessoas = PESSOAS.reduce((acc, p) => acc + p.qtd, 0)

  useEffect(() => {
    registrarPreview("coordenador")
  }, [])

  function fakeRecalcular() {
    toast.success(`Necessidades recalculadas: ${necessidades.length} item(s).`, {
      description: "(no app real, isso roda no servidor)",
    })
  }

  function diasAte(prazo) {
    return Math.ceil(
      (new Date(prazo).getTime() - agora) / (1000 * 60 * 60 * 24)
    )
  }

  const urgentes = necessidades.filter((n) => diasAte(n.prazo) <= 3)

  return (
    <PreviewShell role="coordenador" usuarioFake={USUARIO_FAKE}>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Painel do coordenador
          </h1>
          <p className="text-sm text-muted-foreground">
            Olá, Ana. Aqui está como o seu abrigo está agora.
          </p>
        </div>

        {/* abrigo card */}
        <Card>
          <CardContent className="pt-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Abrigo selecionado
              </div>
              <div className="font-semibold">{ABRIGO.nome}</div>
              <div className="text-xs text-muted-foreground">
                {ABRIGO.localizacao}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Ocupação</div>
              <div className="font-semibold tabular-nums">
                {totalPessoas} / {ABRIGO.capacidade}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid md:grid-cols-4 gap-4">
          <Kpi titulo="Pessoas abrigadas" valor={totalPessoas} sub={`de ${ABRIGO.capacidade} de capacidade`} tom="primary">
            <Progress
              value={(totalPessoas / ABRIGO.capacidade) * 100}
              className="h-1.5"
            />
          </Kpi>
          <Kpi
            titulo="Casos especiais"
            valor={CASOS.length}
            sub={`${CASOS.length} pessoa(s) com necessidades especiais`}
            tom="special"
          />
          <Kpi
            titulo="Necessidades abertas"
            valor={necessidades.length}
            sub={
              urgentes.length > 0
                ? `${urgentes.length} com prazo < 3 dias`
                : "nenhuma urgente"
            }
            tom={urgentes.length > 0 ? "destructive" : "primary"}
          />
          <Kpi
            titulo="Doações chegando"
            valor={MATCHES.length}
            sub="aguardando recebimento"
            tom="accent"
          />
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Necessidades ativas</CardTitle>
                  <CardDescription>
                    O que falta para os próximos dias.
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={fakeRecalcular}>
                  Recalcular
                </Button>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {necessidades.map((n) => {
                    const dias = diasAte(n.prazo)
                    return (
                      <li
                        key={n.id}
                        className="py-3 flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {n.tipo_nome}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Precisa de {n.qtd_necessaria} {n.unidade_medida}{" "}
                            · prazo {formatarData(n.prazo)} (em {dias} dia
                            {dias === 1 ? "" : "s"})
                          </div>
                        </div>
                        <StatusBadge tipo="necessidade" status={n.status} />
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Composição demográfica</CardTitle>
                <CardDescription>Pessoas abrigadas por categoria.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {PESSOAS.map((p) => {
                    const pct = (p.qtd / totalPessoas) * 100
                    return (
                      <div key={p.categoria} className="space-y-1">
                        <div className="flex items-baseline justify-between text-sm">
                          <span>{CATEGORIA_VITIMA[p.categoria]}</span>
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
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alertas</CardTitle>
                <CardDescription>O que merece atenção imediata.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {urgentes.slice(0, 2).map((n) => (
                  <div
                    key={n.id}
                    className="rounded-lg border p-3 border-destructive/40 bg-destructive/10 text-destructive"
                  >
                    <div className="text-sm font-medium">
                      Prazo apertado: {n.tipo_nome}
                    </div>
                    <div className="text-xs mt-0.5 opacity-90">
                      Faltam {n.qtd_necessaria} unidade(s) até{" "}
                      {formatarData(n.prazo)}.
                    </div>
                  </div>
                ))}
                {CASOS.slice(0, 2).map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border p-3 border-special/40 bg-special/10 text-special"
                  >
                    <div className="text-sm font-medium">
                      Caso especial: {CONDICAO_ESPECIAL[c.condicao]}
                    </div>
                    <div className="text-xs mt-0.5 opacity-90">
                      {c.observacao}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Doações chegando</CardTitle>
                <CardDescription>Matches aceitos e em entrega.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {MATCHES.map((m) => (
                    <li key={m.id} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{m.tipo_nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {m.qtd_casada} unidade(s)
                          </div>
                        </div>
                        <StatusBadge tipo="match" status={m.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PreviewShell>
  )
}

function Kpi({ titulo, valor, sub, tom = "primary", children }) {
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
        <div className={`text-3xl font-semibold ${cores[tom]}`}>{valor}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
        {children}
      </CardContent>
    </Card>
  )
}
