import { Link } from "react-router-dom"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"

const ROLE_LABEL = {
  coordenador: "Coordenador de abrigo",
  doador: "Doador",
  voluntario: "Voluntário",
}

export function PreviewShell({ role, usuarioFake, children }) {
  return (
    <div className="min-h-svh bg-background flex flex-col">
      {/* BANNER MODO DEMO */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
            Modo demo
          </span>
          <span className="opacity-90 hidden sm:inline">·</span>
          <span className="opacity-90">
            Você está vendo o painel de{" "}
            <strong>{ROLE_LABEL[role] || role}</strong> com dados fictícios
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
            >
              <Link to="/cadastro">Criar conta de verdade</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/">Sair do demo</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* HEADER FAKE */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <Logo size={28} />
            <span className="font-semibold text-lg tracking-tight text-foreground">
              &lt;&lt;NOME&gt;&gt;
            </span>
          </Link>

          {usuarioFake && (
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium leading-tight">
                  {usuarioFake.nome}
                </div>
                <div className="text-xs text-muted-foreground leading-tight">
                  {usuarioFake.descricao}
                </div>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-xs font-medium">
                {usuarioFake.iniciais}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Gostou do que viu? Crie uma conta e use de verdade.
          </p>
          <div className="flex justify-center gap-2">
            <Button asChild>
              <Link to="/cadastro">Criar conta</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/">Voltar à home</Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
