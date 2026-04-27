import { Link } from "react-router-dom"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { rotaInicialPorRole } from "@/lib/enums"

export function PublicShell({ children, hideCtas = false }) {
  const { usuario } = useAuth()

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <Logo size={28} />
            <span className="font-semibold text-lg tracking-tight text-foreground">
              Reabrigo
            </span>
          </Link>

          {!hideCtas && (
            <nav className="flex items-center gap-2">
              {usuario ? (
                <Button asChild variant="default">
                  <Link to={rotaInicialPorRole(usuario.role)}>
                    Ir para meu painel
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost">
                    <Link to="/login">Entrar</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/cadastro">Cadastrar-se</Link>
                  </Button>
                </>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground space-y-1">
        <div>
          <span className="font-medium text-foreground">Reabrigo</span> · apoio
          coordenado a abrigos em enchentes
        </div>
        <div>
          Projeto educacional ·{" "}
          <a
            href="https://github.com/jampani1/desafio-enchentes"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            github.com/jampani1
          </a>
        </div>
      </footer>
    </div>
  )
}
