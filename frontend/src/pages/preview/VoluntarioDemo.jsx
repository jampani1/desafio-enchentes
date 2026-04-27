import { useEffect } from "react"
import { Link } from "react-router-dom"
import { addHours, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { registrarPreview } from "@/lib/preview"
import { PreviewShell } from "@/components/PreviewShell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const USUARIO_FAKE = {
  nome: "Lucas Almeida",
  descricao: "Voluntário · Demo",
  iniciais: "LA",
}

const HABILIDADES = [
  { id: "enf", label: "Enfermagem", certificado: true },
  { id: "mot", label: "Motorista", certificado: true },
  { id: "coz", label: "Cozinha", certificado: false },
]

const CHAMADAS = [
  {
    id: "ch1",
    abrigo: "Escola Municipal Esperança",
    distancia_km: 1.2,
    skill: "Enfermagem",
    titulo: "Acompanhamento de gestante (33 sem) — turno noturno",
    descricao:
      "Precisamos de um(a) enfermeiro(a) para o turno das 19h às 7h. Há gestante próxima do parto.",
    urgencia: "alta",
    aberta_em: addHours(new Date(), -3).toISOString(),
  },
  {
    id: "ch2",
    abrigo: "Ginásio Poliesportivo",
    distancia_km: 3.4,
    skill: "Motorista",
    titulo: "Transporte de doação — sábado 10h",
    descricao:
      "Carga de 200kg de alimentos não perecíveis, retirada no Atacadão da Av. Brasil.",
    urgencia: "media",
    aberta_em: addHours(new Date(), -8).toISOString(),
  },
  {
    id: "ch3",
    abrigo: "Centro Comunitário São José",
    distancia_km: 5.1,
    skill: "Cozinha",
    titulo: "Apoio nas refeições do almoço — 4 dias",
    descricao:
      "Buscamos voluntários(as) para preparar 60 refeições/dia das 9h às 13h.",
    urgencia: "baixa",
    aberta_em: addHours(new Date(), -22).toISOString(),
  },
]

const ABRIGOS_PROXIMOS = [
  { nome: "Escola Municipal Esperança", distancia: "1.2 km", chamadas: 1 },
  { nome: "Ginásio Poliesportivo", distancia: "3.4 km", chamadas: 2 },
  { nome: "Centro Comunitário São José", distancia: "5.1 km", chamadas: 1 },
]

const HISTORICO = [
  { acao: "Plantão de enfermagem (8h)", abrigo: "Escola Esperança", data: "21/04" },
  { acao: "Transporte de cobertores", abrigo: "Ginásio Poliesportivo", data: "18/04" },
  { acao: "Plantão de enfermagem (12h)", abrigo: "Escola Esperança", data: "15/04" },
]

const URG_TONS = {
  alta: "border-destructive/40 bg-destructive/10 text-destructive",
  media: "border-warn/40 bg-warn/15 text-warn-foreground",
  baixa: "border-accent/40 bg-accent/10 text-accent",
}

const URG_LABEL = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
}

export function VoluntarioDemo() {
  useEffect(() => {
    registrarPreview("voluntario")
  }, [])

  return (
    <PreviewShell role="voluntario" usuarioFake={USUARIO_FAKE}>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Aviso de funcionalidade futura */}
        <Alert className="border-special/40 bg-special/5">
          <AlertTitle className="text-special">
            Visão conceitual do papel de voluntário
          </AlertTitle>
          <AlertDescription>
            Esta tela mostra como será o painel quando o módulo de voluntários
            for liberado. Os dados aqui são fictícios.
          </AlertDescription>
        </Alert>

        {/* Hero */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Olá, Lucas. Há gente precisando perto de você.
            </h1>
            <p className="text-sm text-muted-foreground">
              Vimos suas habilidades e selecionamos chamadas que combinam.
              Você decide se topa.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {HABILIDADES.map((h) => (
                <Badge
                  key={h.id}
                  variant="outline"
                  className={
                    h.certificado
                      ? "bg-accent/15 text-accent border-accent/30"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {h.label}
                  {h.certificado && (
                    <span className="ml-1 text-[10px]">· verificado</span>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <Card className="lg:col-span-1">
            <CardContent className="pt-5 space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Status atual
              </div>
              <div className="text-2xl font-semibold text-accent">
                Disponível
              </div>
              <div className="text-xs text-muted-foreground">
                Você está aceitando chamadas
              </div>
              <Button size="sm" variant="outline" className="w-full mt-2">
                Pausar disponibilidade
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Chamadas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chamadas abertas</CardTitle>
            <CardDescription>
              Necessidades de voluntários nos abrigos próximos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {CHAMADAS.map((c) => (
                <li
                  key={c.id}
                  className="rounded-md border p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{c.titulo}</span>
                        <Badge
                          variant="outline"
                          className={URG_TONS[c.urgencia]}
                        >
                          urgência {URG_LABEL[c.urgencia]}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.abrigo} · {c.distancia_km} km · {c.skill} ·{" "}
                        aberta{" "}
                        {formatDistanceToNow(new Date(c.aberta_em), {
                          locale: ptBR,
                          addSuffix: true,
                        })}
                      </div>
                      <p className="text-sm">{c.descricao}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm">Aceitar chamada</Button>
                    <Button size="sm" variant="ghost">
                      Ver detalhes
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Abrigos próximos + histórico */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Abrigos próximos</CardTitle>
              <CardDescription>
                Em até 10 km do seu endereço cadastrado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {ABRIGOS_PROXIMOS.map((a) => (
                  <li
                    key={a.nome}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">{a.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.distancia}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary border-primary/30"
                    >
                      {a.chamadas} chamada{a.chamadas === 1 ? "" : "s"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Suas ações</CardTitle>
              <CardDescription>
                Histórico das últimas semanas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {HISTORICO.map((h, i) => (
                  <li
                    key={i}
                    className="flex items-baseline justify-between gap-2 text-sm border-b last:border-0 pb-2 last:pb-0"
                  >
                    <div>
                      <div>{h.acao}</div>
                      <div className="text-xs text-muted-foreground">
                        {h.abrigo}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {h.data}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground mb-3">
            Quando o módulo de voluntários for liberado, você poderá criar uma
            conta com suas habilidades.
          </p>
          <Button asChild>
            <Link to="/cadastro">Criar conta agora</Link>
          </Button>
        </div>
      </div>
    </PreviewShell>
  )
}
