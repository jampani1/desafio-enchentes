import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { AppShell } from "@/components/AppShell"
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
import { Skeleton } from "@/components/ui/skeleton"

export function AbrigoForm({ modo = "criar" }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: "", localizacao: "", capacidade: "" })
  const [carregando, setCarregando] = useState(modo === "editar")
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState("")

  useEffect(() => {
    if (modo !== "editar" || !id) return
    api
      .get(`/abrigos/${id}`)
      .then((a) =>
        setForm({
          nome: a.nome || "",
          localizacao: a.localizacao || "",
          capacidade: String(a.capacidade ?? ""),
        })
      )
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false))
  }, [modo, id])

  function up(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro("")
    setEnviando(true)
    try {
      const body = {
        nome: form.nome.trim(),
        localizacao: form.localizacao.trim(),
        capacidade: Number(form.capacidade),
      }
      if (modo === "criar") {
        const novo = await api.post("/abrigos", body)
        toast.success("Abrigo criado!")
        navigate(`/coordenador/abrigos/${novo.id}`, { replace: true })
      } else {
        await api.put(`/abrigos/${id}`, body)
        toast.success("Abrigo atualizado.")
        navigate(`/coordenador/abrigos/${id}`, { replace: true })
      }
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/coordenador">← Voltar</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {modo === "criar" ? "Novo abrigo" : "Editar abrigo"}
            </CardTitle>
            <CardDescription>
              {modo === "criar"
                ? "Preencha os dados básicos. Você poderá cadastrar pessoas e estoque depois."
                : "Atualize os dados do seu abrigo."}
            </CardDescription>
          </CardHeader>

          {carregando ? (
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do abrigo</Label>
                  <Input
                    id="nome"
                    required
                    minLength={2}
                    maxLength={255}
                    placeholder="Ex.: Escola Municipal Esperança"
                    value={form.nome}
                    onChange={(e) => up("nome", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localizacao">Localização</Label>
                  <Input
                    id="localizacao"
                    required
                    minLength={2}
                    maxLength={500}
                    placeholder="Endereço completo"
                    value={form.localizacao}
                    onChange={(e) => up("localizacao", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacidade">Capacidade (pessoas)</Label>
                  <Input
                    id="capacidade"
                    type="number"
                    min={1}
                    required
                    value={form.capacidade}
                    onChange={(e) => up("capacidade", e.target.value)}
                  />
                </div>
                {erro && (
                  <p className="text-sm text-destructive" role="alert">
                    {erro}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="ghost" asChild>
                  <Link to="/coordenador">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={enviando}>
                  {enviando
                    ? "Salvando..."
                    : modo === "criar"
                      ? "Criar abrigo"
                      : "Salvar alterações"}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
