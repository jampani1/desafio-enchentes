import { useEffect } from "react"
import { Link } from "react-router-dom"
import { addDays, format } from "date-fns"
import { formatarData, formatarRelativo } from "@/lib/formatters"
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
  nome: "Atacadão Solidário",
  descricao: "Doador (PJ) · Demo",
  iniciais: "AS",
}

const hoje = new Date()

const OFERTAS = [
  {
    id: "o1",
    tipo_nome: "Arroz tipo 1",
    qtd_ofertada: 80,
    unidade_medida: "pacote 5kg",
    status: "ofertada",
    data_entrega: format(addDays(hoje, 2), "yyyy-MM-dd"),
    criado_em: addDays(hoje, -1).toISOString(),
  },
  {
    id: "o2",
    tipo_nome: "Óleo de soja",
    qtd_ofertada: 60,
    unidade_medida: "garrafa 900ml",
    status: "em_match",
    data_entrega: format(addDays(hoje, 4), "yyyy-MM-dd"),
    criado_em: addDays(hoje, -3).toISOString(),
  },
  {
    id: "o3",
    tipo_nome: "Sabonete em barra",
    qtd_ofertada: 200,
    unidade_medida: "un",
    status: "entregue",
    data_entrega: format(addDays(hoje, -2), "yyyy-MM-dd"),
    criado_em: addDays(hoje, -8).toISOString(),
  },
]

const ABRIGOS_PUB = [
  {
    id: "a1",
    nome: "Escola Municipal Esperança",
    localizacao: "Rua das Flores, 230 — Centro",
    capacidade: 80,
    ocupacao_atual: 23,
    vagas: 57,
  },
  {
    id: "a2",
    nome: "Ginásio Poliesportivo",
    localizacao: "Av. Brasil, 1500 — Vila Nova",
    capacidade: 120,
    ocupacao_atual: 78,
    vagas: 42,
  },
  {
    id: "a3",
    nome: "Centro Comunitário São José",
    localizacao: "R. Sete de Setembro, 88 — Bairro Alto",
    capacidade: 50,
    ocupacao_atual: 50,
    vagas: 0,
  },
]

const MATCHES = [
  {
    id: "m1",
    tipo_nome: "Óleo de soja",
    qtd_casada: 60,
    status: "aceito",
    abrigo_nome: "Escola Municipal Esperança",
    criado_em: addDays(hoje, -1).toISOString(),
  },
  {
    id: "m2",
    tipo_nome: "Sabonete em barra",
    qtd_casada: 200,
    status: "recebido",
    abrigo_nome: "Ginásio Poliesportivo",
    criado_em: addDays(hoje, -7).toISOString(),
  },
]

export function DoadorDemo() {
  useEffect(() => {
    registrarPreview("doador")
  }, [])

  const ativas = OFERTAS.filter(
    (o) => o.status !== "entregue" && o.status !== "cancelada"
  ).length
  const entregues = OFERTAS.filter((o) => o.status === "entregue").length

  return (
    <PreviewShell role="doador" usuarioFake={USUARIO_FAKE}>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* hero CTA contextual */}
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="pt-5 pb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1 max-w-xl">
              <div className="text-xs uppercase tracking-wide text-primary font-semibold">
                Como doador (PJ)
              </div>
              <h2 className="text-lg font-semibold">
                Você tem um atacado, supermercado ou farmácia?
              </h2>
              <p className="text-sm text-muted-foreground">
                Veja necessidades reais, calculadas pelos coordenadores. Doe o
                que faz sentido pro seu negócio — sem desperdiçar nem desconfiar
                se a ajuda vai chegar onde precisa.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/cadastro">Cadastrar minha empresa</Link>
            </Button>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Ofertas ativas
              </div>
              <div className="text-3xl font-semibold text-primary mt-1">
                {ativas}
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
                {entregues}
              </div>
              <div className="text-xs text-muted-foreground">
                Obrigado por ajudar.
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Matches em curso
              </div>
              <div className="text-3xl font-semibold text-warn-foreground mt-1">
                {MATCHES.filter((m) => m.status !== "recebido").length}
              </div>
              <div className="text-xs text-muted-foreground">
                ofertas casadas com necessidades
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MINHAS OFERTAS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suas ofertas</CardTitle>
            <CardDescription>
              Tudo que sua empresa cadastrou pra doar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {OFERTAS.map((o) => (
                <li key={o.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{o.tipo_nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.qtd_ofertada} {o.unidade_medida} · entrega em{" "}
                      {formatarData(o.data_entrega)}
                    </div>
                  </div>
                  <StatusBadge tipo="oferta" status={o.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* ABRIGOS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Abrigos cadastrados</CardTitle>
            <CardDescription>
              Veja onde sua doação pode chegar. Lista pública.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ABRIGOS_PUB.map((a) => {
                const pct = (a.ocupacao_atual / a.capacidade) * 100
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
                        {a.ocupacao_atual} de {a.capacidade}
                      </span>
                      <span
                        className={
                          a.vagas > 0
                            ? "text-accent font-medium"
                            : "text-destructive font-medium"
                        }
                      >
                        {a.vagas} vagas
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* MATCHES */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seus matches</CardTitle>
            <CardDescription>
              Ofertas casadas com necessidades de abrigos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {MATCHES.map((m) => (
                <li key={m.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{m.tipo_nome}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.qtd_casada} unidade(s) · para {m.abrigo_nome} ·{" "}
                        {formatarRelativo(m.criado_em)}
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
    </PreviewShell>
  )
}
