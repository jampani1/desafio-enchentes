import { Link, useNavigate } from "react-router-dom"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/AuthContext"
import { iniciaisDoNome } from "@/lib/formatters"
import { ROLE, rotaInicialPorRole } from "@/lib/enums"

export function AppShell({ children }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  function handleSair() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to={rotaInicialPorRole(usuario?.role)}
            className="flex items-center gap-2 text-primary"
          >
            <Logo size={28} />
            <span className="font-semibold text-lg tracking-tight text-foreground">
              Reabrigo
            </span>
          </Link>

          {usuario && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 h-auto py-1.5 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {iniciaisDoNome(usuario.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden sm:block">
                    <div className="text-sm font-medium leading-tight">
                      {usuario.nome}
                    </div>
                    <div className="text-xs text-muted-foreground leading-tight">
                      {ROLE[usuario.role] || usuario.role}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-normal text-xs text-muted-foreground">
                    Logado como
                  </div>
                  <div className="truncate">{usuario.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate(rotaInicialPorRole(usuario.role))}
                >
                  Painel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSair} variant="destructive">
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
