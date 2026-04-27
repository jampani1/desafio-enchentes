import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { PublicShell } from "@/components/PublicShell"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/EmptyState"
import { Progress } from "@/components/ui/progress"

export function Landing() {
  const [abrigos, setAbrigos] = useState(null)
  const [erro, setErro] = useState("")

  useEffect(() => {
    api
      .unauth.get("/publico/abrigos")
      .then((data) => setAbrigos(Array.isArray(data) ? data : []))
      .catch((err) => setErro(err.message))
  }, [])

  return (
    <PublicShell>
      {/* HERO */}
      <section className="bg-linear-to-b from-primary/8 to-background border-b">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Apoio coordenado em enchentes
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
              Conectando quem doa{" "}
              <span className="text-primary">com quem precisa</span>, com base
              em dados reais.
            </h1>
            <p className="text-muted-foreground text-lg">
              Coordenadores de abrigos cadastram pessoas e estoque. O sistema
              calcula automaticamente o que falta. Doadores veem necessidades
              concretas e oferecem o que podem.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/cadastro">Quero ajudar</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">Entrar</Link>
              </Button>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
              <div className="relative bg-card border rounded-2xl p-12 shadow-sm text-primary">
                <Logo size={160} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl font-semibold">Como funciona</h2>
          <p className="text-muted-foreground">
            Três etapas pra transformar boa vontade em ajuda na medida certa.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              n: "1",
              titulo: "Coordenador cadastra o abrigo",
              texto:
                "Composição demográfica e estoque atual. Sem nomes, só agregados.",
            },
            {
              n: "2",
              titulo: "Sistema calcula necessidades",
              texto:
                "Aplica regras de consumo e projeta o que vai faltar nos próximos dias.",
            },
            {
              n: "3",
              titulo: "Doadores oferecem com precisão",
              texto:
                "Veem demandas reais e doam exatamente o que cada abrigo precisa.",
            },
          ].map((p) => (
            <Card key={p.n}>
              <CardContent className="pt-6 space-y-2">
                <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {p.n}
                </div>
                <h3 className="font-medium">{p.titulo}</h3>
                <p className="text-sm text-muted-foreground">{p.texto}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* EXPERIMENTE SEM CADASTRAR */}
      <section className="border-y bg-primary/5">
        <div className="max-w-6xl mx-auto px-4 py-16 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Experimente sem cadastrar
            </div>
            <h2 className="text-2xl font-semibold">
              Veja como cada papel funciona, com dados de exemplo.
            </h2>
            <p className="text-muted-foreground">
              Entre em modo demo e navegue na visão de quem coordena, de quem
              doa ou de quem se voluntaria. Você decide se cadastra de verdade
              depois.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <DemoOpcao
              titulo="Como coordenador"
              descricao="Você gerencia um abrigo: vê pessoas, estoque, necessidades calculadas e doações chegando."
              cta="Entrar como coordenador"
              to="/preview/coordenador"
              tom="primary"
            />
            <DemoOpcao
              titulo="Como doador"
              descricao="Sua empresa (atacado, farmácia, ONG) doa o que faz sentido pro seu negócio. Doação direcionada."
              cta="Entrar como doador"
              to="/preview/doador"
              tom="accent"
            />
            <DemoOpcao
              titulo="Como voluntário"
              descricao="Você é enfermeiro, motorista, cozinheiro? Veja chamadas perto de você. (Em breve no app real.)"
              cta="Entrar como voluntário"
              to="/preview/voluntario"
              tom="special"
              novo
            />
          </div>
        </div>
      </section>

      {/* ABRIGOS COM VAGAS */}
      <section className="bg-muted/40 border-t">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Abrigos cadastrados</h2>
              <p className="text-muted-foreground text-sm">
                Lista pública e em tempo real. Vagas com base em ocupação atual.
              </p>
            </div>
          </div>

          {erro && (
            <Card className="border-destructive/40">
              <CardContent className="py-6 text-sm text-destructive">
                {erro}
              </CardContent>
            </Card>
          )}

          {!erro && abrigos === null && (
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          )}

          {!erro && abrigos?.length === 0 && (
            <EmptyState
              titulo="Nenhum abrigo cadastrado"
              descricao="Quando coordenadores cadastrarem abrigos, eles aparecerão aqui."
            />
          )}

          {!erro && abrigos?.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4">
              {abrigos.map((a) => {
                const cap = a.capacidade ?? 0
                const oc = a.ocupacao_atual ?? 0
                const pct = cap > 0 ? Math.min(100, (oc / cap) * 100) : 0
                return (
                  <Card key={a.id}>
                    <CardContent className="pt-6 space-y-3">
                      <div>
                        <h3 className="font-medium leading-tight">{a.nome}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {a.localizacao}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="text-muted-foreground">
                            Ocupação
                          </span>
                          <span className="font-medium">
                            {oc} / {cap}
                          </span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Vagas: </span>
                        <span className="font-semibold text-accent">
                          {a.vagas ?? cap - oc}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </PublicShell>
  )
}

function DemoOpcao({ titulo, descricao, cta, to, tom = "primary", novo }) {
  const tomClasses = {
    primary: "border-primary/40 hover:border-primary",
    accent: "border-accent/40 hover:border-accent",
    special: "border-special/40 hover:border-special",
  }
  const dotClasses = {
    primary: "bg-primary",
    accent: "bg-accent",
    special: "bg-special",
  }
  return (
    <Card className={`transition-colors ${tomClasses[tom]}`}>
      <CardContent className="pt-6 pb-6 space-y-3 flex flex-col h-full">
        <div className="flex items-center justify-between">
          <span className={`h-2 w-2 rounded-full ${dotClasses[tom]}`} />
          {novo && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-special">
              em breve
            </span>
          )}
        </div>
        <h3 className="font-semibold">{titulo}</h3>
        <p className="text-sm text-muted-foreground flex-1">{descricao}</p>
        <Button asChild variant="outline" className="w-full">
          <Link to={to}>{cta}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
