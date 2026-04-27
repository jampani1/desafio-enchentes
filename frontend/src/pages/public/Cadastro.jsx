import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
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

const ROLES_PUBLICAS = [
  {
    value: "coordenador",
    titulo: "Sou coordenador de abrigo",
    descricao: "Cadastro um abrigo, gerencio pessoas, estoque e necessidades.",
  },
  {
    value: "doador",
    titulo: "Quero doar",
    descricao: "Vejo necessidades reais e ofereço o que tenho a doar.",
  },
]

export function Cadastro() {
  const { cadastrar } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    senha2: "",
    role: "coordenador",
    cpf_ou_cnpj: "",
    telefone: "",
  })
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)

  function up(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro("")

    if (form.senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.")
      return
    }
    if (form.senha !== form.senha2) {
      setErro("As senhas não conferem.")
      return
    }

    setLoading(true)
    try {
      const dados = {
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
        role: form.role,
      }
      if (form.cpf_ou_cnpj.trim()) dados.cpf_ou_cnpj = form.cpf_ou_cnpj.trim()
      if (form.telefone.trim()) dados.telefone = form.telefone.trim()

      const u = await cadastrar(dados)
      toast.success(`Conta criada! Bem-vindo, ${u.nome.split(" ")[0]}.`)
      navigate(rotaInicialPorRole(u.role), { replace: true })
    } catch (err) {
      if (err.status === 409) {
        setErro("Este e-mail já está cadastrado.")
      } else {
        setErro(err.message || "Não foi possível concluir o cadastro.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicShell>
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Criar conta</CardTitle>
            <CardDescription>
              Você participa como coordenador de abrigo ou como doador.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <div>
                <Label className="mb-2 block">Como você participa?</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {ROLES_PUBLICAS.map((r) => {
                    const ativo = form.role === r.value
                    return (
                      <button
                        type="button"
                        key={r.value}
                        onClick={() => up("role", r.value)}
                        className={`text-left rounded-lg border p-3 transition ${
                          ativo
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <div className="font-medium text-sm">{r.titulo}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {r.descricao}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  required
                  minLength={2}
                  value={form.nome}
                  onChange={(e) => up("nome", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => up("email", e.target.value)}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={form.senha}
                    onChange={(e) => up("senha", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha2">Confirme a senha</Label>
                  <Input
                    id="senha2"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={form.senha2}
                    onChange={(e) => up("senha2", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf_ou_cnpj">
                    CPF ou CNPJ{" "}
                    <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <Input
                    id="cpf_ou_cnpj"
                    value={form.cpf_ou_cnpj}
                    onChange={(e) => up("cpf_ou_cnpj", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">
                    Telefone{" "}
                    <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <Input
                    id="telefone"
                    type="tel"
                    value={form.telefone}
                    onChange={(e) => up("telefone", e.target.value)}
                  />
                </div>
              </div>

              {erro && (
                <p className="text-sm text-destructive" role="alert">
                  {erro}
                </p>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3 mt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando conta..." : "Criar conta"}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Já tem conta?{" "}
                <Link
                  to="/login"
                  className="text-primary underline underline-offset-4"
                >
                  Entrar
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </PublicShell>
  )
}
