import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { rotaInicialPorRole } from "@/lib/enums"
import { PublicShell } from "@/components/PublicShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro("")
    setLoading(true)
    try {
      const u = await login({ email, senha })
      toast.success(`Bem-vindo de volta, ${u.nome.split(" ")[0]}!`)
      const destino =
        location.state?.from?.pathname || rotaInicialPorRole(u.role)
      navigate(destino, { replace: true })
    } catch (err) {
      setErro(err.message || "Falha no login.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicShell>
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Entrar</CardTitle>
            <CardDescription>
              Acesse seu painel para gerenciar abrigos ou enviar doações.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>

              {erro && (
                <p className="text-sm text-destructive" role="alert">
                  {erro}
                </p>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3 mt-6">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Ainda não tem conta?{" "}
                <Link
                  to="/cadastro"
                  className="text-primary underline underline-offset-4"
                >
                  Cadastre-se
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </PublicShell>
  )
}
