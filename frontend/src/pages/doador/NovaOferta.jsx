import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { format } from "date-fns"
import { api, ApiError } from "@/lib/api"
import { CATEGORIA_RECURSO } from "@/lib/enums"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function NovaOferta() {
  const navigate = useNavigate()
  const hoje = format(new Date(), "yyyy-MM-dd")

  const [tipos, setTipos] = useState(null)
  const [tiposIndisponivel, setTiposIndisponivel] = useState(false)
  const [form, setForm] = useState({
    tipo_recurso_id: "",
    qtd_ofertada: "",
    data_entrega: "",
  })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState("")

  useEffect(() => {
    api
      .unauth.get("/tipos-recurso")
      .then((data) => setTipos(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (err instanceof ApiError && err.status >= 500) {
          setTiposIndisponivel(true)
        }
        setTipos([])
      })
  }, [])

  function up(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro("")
    setEnviando(true)
    try {
      await api.post("/ofertas", {
        tipo_recurso_id: Number(form.tipo_recurso_id),
        qtd_ofertada: Number(form.qtd_ofertada),
        data_entrega: form.data_entrega,
      })
      toast.success("Oferta registrada! Obrigado por ajudar.")
      navigate("/doador", { replace: true })
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const tiposPorCategoria = (tipos || []).reduce((acc, t) => {
    const cat = t.categoria || "outros"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/doador">← Voltar</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nova oferta</CardTitle>
            <CardDescription>
              Conte o que você pode doar e quando consegue entregar. Os
              coordenadores fazem o match com as necessidades.
            </CardDescription>
          </CardHeader>

          {tiposIndisponivel && (
            <CardContent className="pb-0">
              <Alert>
                <AlertTitle>Catálogo em construção</AlertTitle>
                <AlertDescription>
                  A lista de tipos de recurso está em desenvolvimento. Tente
                  novamente em alguns minutos.
                </AlertDescription>
              </Alert>
            </CardContent>
          )}

          {tipos === null ? (
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Recurso</Label>
                  <Select
                    value={form.tipo_recurso_id}
                    onValueChange={(v) => up("tipo_recurso_id", v)}
                    disabled={tipos.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          tipos.length === 0
                            ? "Catálogo indisponível"
                            : "Selecione o que você quer doar"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(tiposPorCategoria).map(
                        ([cat, items]) => (
                          <div key={cat}>
                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {CATEGORIA_RECURSO[cat] || cat}
                            </div>
                            {items.map((t) => (
                              <SelectItem key={t.id} value={String(t.id)}>
                                {t.nome}
                                {t.unidade_medida
                                  ? ` (${t.unidade_medida})`
                                  : ""}
                              </SelectItem>
                            ))}
                          </div>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qtd-ofer">Quantidade</Label>
                  <Input
                    id="qtd-ofer"
                    type="number"
                    min={1}
                    required
                    value={form.qtd_ofertada}
                    onChange={(e) => up("qtd_ofertada", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data">Data de entrega</Label>
                  <Input
                    id="data"
                    type="date"
                    min={hoje}
                    required
                    value={form.data_entrega}
                    onChange={(e) => up("data_entrega", e.target.value)}
                  />
                </div>

                {erro && (
                  <p className="text-sm text-destructive" role="alert">
                    {erro}
                  </p>
                )}
              </CardContent>

              <CardFooter className="flex justify-end gap-2 mt-2">
                <Button asChild variant="ghost">
                  <Link to="/doador">Cancelar</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={
                    enviando ||
                    !form.tipo_recurso_id ||
                    !form.qtd_ofertada ||
                    !form.data_entrega
                  }
                >
                  {enviando ? "Enviando..." : "Registrar oferta"}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
