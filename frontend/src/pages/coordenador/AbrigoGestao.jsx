import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api"
import {
  CATEGORIA_VITIMA,
  CATEGORIA_VITIMA_OPTIONS,
  CONDICAO_ESPECIAL,
  CONDICAO_ESPECIAL_OPTIONS,
  CATEGORIA_RECURSO,
} from "@/lib/enums"
import {
  formatarData,
  formatarRelativo,
  diasAteHoje,
} from "@/lib/formatters"
import { AppShell } from "@/components/AppShell"
import { StatusBadge } from "@/components/StatusBadge"
import { EmptyState } from "@/components/EmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export function AbrigoGestao() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [abrigo, setAbrigo] = useState(null)
  const [erro, setErro] = useState("")
  const [excluirOpen, setExcluirOpen] = useState(false)
  const [excluirConfirma, setExcluirConfirma] = useState("")
  const [excluindo, setExcluindo] = useState(false)

  useEffect(() => {
    api
      .get(`/abrigos/${id}`)
      .then(setAbrigo)
      .catch((err) => setErro(err.message))
  }, [id])

  async function handleExcluir() {
    if (excluirConfirma !== abrigo.nome) return
    setExcluindo(true)
    try {
      await api.del(`/abrigos/${id}`)
      toast.success("Abrigo excluído.")
      navigate("/coordenador", { replace: true })
    } catch (err) {
      toast.error(err.message)
      setExcluindo(false)
    }
  }

  if (erro) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar abrigo</AlertTitle>
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        </div>
      </AppShell>
    )
  }

  if (!abrigo) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-12 w-72" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
              <Link to="/coordenador">← Voltar ao painel</Link>
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">
              {abrigo.nome}
            </h1>
            <p className="text-sm text-muted-foreground">
              {abrigo.localizacao} · capacidade {abrigo.capacidade}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/coordenador/abrigos/${id}/editar`}>Editar</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setExcluirOpen(true)}
            >
              Excluir
            </Button>
          </div>
        </div>

        {/* TABS */}
        <Tabs defaultValue="pessoas">
          <TabsList className="grid grid-cols-4 max-w-2xl">
            <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
            <TabsTrigger value="casos">Casos</TabsTrigger>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
            <TabsTrigger value="necessidades">Necessidades</TabsTrigger>
          </TabsList>

          <TabsContent value="pessoas" className="mt-4">
            <TabPessoas abrigoId={id} />
          </TabsContent>
          <TabsContent value="casos" className="mt-4">
            <TabCasos abrigoId={id} />
          </TabsContent>
          <TabsContent value="estoque" className="mt-4">
            <TabEstoque abrigoId={id} />
          </TabsContent>
          <TabsContent value="necessidades" className="mt-4">
            <TabNecessidades abrigoId={id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* DIALOG EXCLUIR */}
      <Dialog open={excluirOpen} onOpenChange={setExcluirOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Excluir abrigo
            </DialogTitle>
            <DialogDescription>
              Esta ação é permanente. Todas as pessoas, casos, estoque e
              necessidades serão removidos junto. Digite o nome do abrigo para
              confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirma">
              Digite <strong>{abrigo.nome}</strong>
            </Label>
            <Input
              id="confirma"
              value={excluirConfirma}
              onChange={(e) => setExcluirConfirma(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setExcluirOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={excluirConfirma !== abrigo.nome || excluindo}
              onClick={handleExcluir}
            >
              {excluindo ? "Excluindo..." : "Excluir definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

/* ====================================================================
 * TAB PESSOAS
 * ==================================================================== */

function TabPessoas({ abrigoId }) {
  const [pessoas, setPessoas] = useState(null)
  const [indisponivel, setIndisponivel] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState(null)

  const carregar = useCallback(async () => {
    setIndisponivel(false)
    try {
      const data = await api.get(`/abrigos/${abrigoId}/pessoas`)
      setPessoas(Array.isArray(data) ? data : [])
    } catch (err) {
      if (err instanceof ApiError && err.status >= 500) {
        setIndisponivel(true)
        setPessoas([])
      } else {
        setPessoas([])
      }
    }
  }, [abrigoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  function abrirNovo() {
    setEditando(null)
    setDialogOpen(true)
  }

  function abrirEditar(p) {
    setEditando(p)
    setDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">Pessoas abrigadas</CardTitle>
          <CardDescription>
            Cadastro agregado por categoria, sem nomes individuais.
          </CardDescription>
        </div>
        <Button size="sm" onClick={abrirNovo} disabled={indisponivel}>
          + adicionar
        </Button>
      </CardHeader>
      <CardContent>
        {indisponivel && (
          <Alert className="mb-4">
            <AlertTitle>Em construção</AlertTitle>
            <AlertDescription>
              A rota de pessoas abrigadas está sendo finalizada no backend.
            </AlertDescription>
          </Alert>
        )}

        {pessoas === null ? (
          <Skeleton className="h-40 w-full" />
        ) : pessoas.length === 0 && !indisponivel ? (
          <EmptyState
            titulo="Nenhuma categoria registrada"
            descricao='Adicione quantas pessoas você tem por categoria (ex: "12 crianças 0-3 anos").'
            acao={
              <Button size="sm" onClick={abrirNovo}>
                Adicionar primeira categoria
              </Button>
            }
          />
        ) : (
          pessoas.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pessoas.map((p) => (
                  <TableRow key={p.categoria}>
                    <TableCell>
                      {CATEGORIA_VITIMA[p.categoria] || p.categoria}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {p.qtd}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirEditar(p)}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}
      </CardContent>

      <DialogPessoa
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        abrigoId={abrigoId}
        editando={editando}
        categoriasUsadas={(pessoas || []).map((p) => p.categoria)}
        onSalvo={carregar}
      />
    </Card>
  )
}

function DialogPessoa({
  open,
  onOpenChange,
  abrigoId,
  editando,
  categoriasUsadas,
  onSalvo,
}) {
  const [categoria, setCategoria] = useState("")
  const [qtd, setQtd] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")

  useEffect(() => {
    if (open) {
      setCategoria(editando?.categoria || "")
      setQtd(editando ? String(editando.qtd) : "")
      setErro("")
    }
  }, [open, editando])

  async function handleSalvar(e) {
    e.preventDefault()
    setErro("")
    setSalvando(true)
    try {
      await api.post(`/abrigos/${abrigoId}/pessoas`, {
        categoria,
        qtd: Number(qtd),
      })
      toast.success("Pessoas registradas.")
      onOpenChange(false)
      onSalvo?.()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const opcoes = CATEGORIA_VITIMA_OPTIONS.filter(
    (o) =>
      !editando &&
      categoriasUsadas.includes(o.value)
        ? false
        : true
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editando ? "Editar quantidade" : "Adicionar categoria"}
          </DialogTitle>
          <DialogDescription>
            Cadastro agregado, sem identificação individual.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSalvar} className="space-y-4">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={categoria}
              onValueChange={setCategoria}
              disabled={!!editando}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {opcoes.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qtd">Quantidade</Label>
            <Input
              id="qtd"
              type="number"
              min={0}
              required
              value={qtd}
              onChange={(e) => setQtd(e.target.value)}
            />
          </div>
          {erro && (
            <p className="text-sm text-destructive" role="alert">
              {erro}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!categoria || salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ====================================================================
 * TAB CASOS ESPECIAIS
 * ==================================================================== */

function TabCasos({ abrigoId }) {
  const [casos, setCasos] = useState(null)
  const [indisponivel, setIndisponivel] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const carregar = useCallback(async () => {
    setIndisponivel(false)
    try {
      const data = await api.get(`/abrigos/${abrigoId}/casos`)
      setCasos(Array.isArray(data) ? data : [])
    } catch (err) {
      if (err instanceof ApiError && err.status >= 500) {
        setIndisponivel(true)
        setCasos([])
      } else {
        setCasos([])
      }
    }
  }, [abrigoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">Casos especiais</CardTitle>
          <CardDescription>
            Condições que demandam suporte específico. Registro sem identificar
            a pessoa.
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          disabled={indisponivel}
        >
          + registrar
        </Button>
      </CardHeader>
      <CardContent>
        {indisponivel && (
          <Alert className="mb-4">
            <AlertTitle>Em construção</AlertTitle>
            <AlertDescription>
              A rota de casos especiais está em desenvolvimento.
            </AlertDescription>
          </Alert>
        )}

        {casos === null ? (
          <Skeleton className="h-32 w-full" />
        ) : casos.length === 0 && !indisponivel ? (
          <EmptyState
            titulo="Nenhum caso especial registrado"
            descricao="Registre condições que precisam de suporte específico (diabetes, gestação, mobilidade reduzida, etc.)."
          />
        ) : (
          casos.length > 0 && (
            <ul className="space-y-3">
              {casos.map((c) => (
                <li
                  key={c.id}
                  className="rounded-md border p-3 flex items-start gap-3"
                >
                  <Badge
                    variant="outline"
                    className="bg-special/15 text-special border-special/30"
                  >
                    {CONDICAO_ESPECIAL[c.condicao] || c.condicao}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    {c.observacao && (
                      <p className="text-sm">{c.observacao}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      registrado {formatarRelativo(c.criado_em)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </CardContent>

      <DialogCaso
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        abrigoId={abrigoId}
        onSalvo={carregar}
      />
    </Card>
  )
}

function DialogCaso({ open, onOpenChange, abrigoId, onSalvo }) {
  const [condicao, setCondicao] = useState("")
  const [obs, setObs] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")

  useEffect(() => {
    if (open) {
      setCondicao("")
      setObs("")
      setErro("")
    }
  }, [open])

  async function handleSalvar(e) {
    e.preventDefault()
    setErro("")
    setSalvando(true)
    try {
      const body = { condicao }
      if (obs.trim()) body.observacao = obs.trim()
      await api.post(`/abrigos/${abrigoId}/casos`, body)
      toast.success("Caso registrado.")
      onOpenChange(false)
      onSalvo?.()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar caso especial</DialogTitle>
          <DialogDescription>
            Sem nome, sem documento. Apenas a condição e uma observação se
            necessário.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSalvar} className="space-y-4">
          <div className="space-y-2">
            <Label>Condição</Label>
            <Select value={condicao} onValueChange={setCondicao}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {CONDICAO_ESPECIAL_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="obs">
              Observação{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <textarea
              id="obs"
              maxLength={1000}
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
              placeholder="Ex.: insulina lenta, próximo do parto, etc."
            />
          </div>
          {erro && (
            <p className="text-sm text-destructive" role="alert">
              {erro}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!condicao || salvando}>
              {salvando ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ====================================================================
 * TAB ESTOQUE
 * ==================================================================== */

function TabEstoque({ abrigoId }) {
  const [estoque, setEstoque] = useState(null)
  const [tipos, setTipos] = useState(null)
  const [estoqueIndisponivel, setEstoqueIndisponivel] = useState(false)
  const [tiposIndisponivel, setTiposIndisponivel] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const carregarEstoque = useCallback(async () => {
    setEstoqueIndisponivel(false)
    try {
      const data = await api.get(`/abrigos/${abrigoId}/estoque`)
      setEstoque(Array.isArray(data) ? data : [])
    } catch (err) {
      if (err instanceof ApiError && err.status >= 500) {
        setEstoqueIndisponivel(true)
        setEstoque([])
      } else {
        setEstoque([])
      }
    }
  }, [abrigoId])

  useEffect(() => {
    carregarEstoque()
  }, [carregarEstoque])

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

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">Estoque</CardTitle>
          <CardDescription>
            Quantidade atual de cada recurso no abrigo.
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          disabled={estoqueIndisponivel || tiposIndisponivel || !tipos?.length}
        >
          atualizar item
        </Button>
      </CardHeader>
      <CardContent>
        {estoqueIndisponivel && (
          <Alert className="mb-4">
            <AlertTitle>Em construção</AlertTitle>
            <AlertDescription>
              A rota de estoque está em desenvolvimento.
            </AlertDescription>
          </Alert>
        )}

        {tiposIndisponivel && !estoqueIndisponivel && (
          <Alert className="mb-4">
            <AlertTitle>Catálogo indisponível</AlertTitle>
            <AlertDescription>
              Não foi possível carregar a lista de tipos de recurso.
            </AlertDescription>
          </Alert>
        )}

        {estoque === null ? (
          <Skeleton className="h-40 w-full" />
        ) : estoque.length === 0 && !estoqueIndisponivel ? (
          <EmptyState
            titulo="Estoque vazio"
            descricao="Atualize um item pra começar a montar o estoque."
          />
        ) : (
          estoque.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Atualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estoque.map((e) => (
                  <TableRow key={`${e.tipo_recurso_id}`}>
                    <TableCell className="font-medium">
                      {e.tipo_nome ||
                        tipos?.find((t) => t.id === e.tipo_recurso_id)?.nome ||
                        `#${e.tipo_recurso_id}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {CATEGORIA_RECURSO[e.categoria] || e.categoria || "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {e.quantidade_atual}
                    </TableCell>
                    <TableCell>{e.unidade_medida || "-"}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatarRelativo(e.atualizado_em)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}
      </CardContent>

      <DialogEstoque
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        abrigoId={abrigoId}
        tipos={tipos || []}
        estoqueAtual={estoque || []}
        onSalvo={carregarEstoque}
      />
    </Card>
  )
}

function DialogEstoque({
  open,
  onOpenChange,
  abrigoId,
  tipos,
  estoqueAtual,
  onSalvo,
}) {
  const [tipoId, setTipoId] = useState("")
  const [qtd, setQtd] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")

  useEffect(() => {
    if (open) {
      setTipoId("")
      setQtd("")
      setErro("")
    }
  }, [open])

  useEffect(() => {
    if (!tipoId) return
    const atual = estoqueAtual.find(
      (e) => String(e.tipo_recurso_id) === String(tipoId)
    )
    if (atual) setQtd(String(atual.quantidade_atual))
  }, [tipoId, estoqueAtual])

  async function handleSalvar(e) {
    e.preventDefault()
    setErro("")
    setSalvando(true)
    try {
      await api.put(`/abrigos/${abrigoId}/estoque`, {
        tipo_recurso_id: Number(tipoId),
        quantidade_atual: Number(qtd),
      })
      toast.success("Estoque atualizado.")
      onOpenChange(false)
      onSalvo?.()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const tiposOrdenados = [...tipos].sort((a, b) => {
    if (a.categoria !== b.categoria) {
      return (a.categoria || "").localeCompare(b.categoria || "")
    }
    return (a.nome || "").localeCompare(b.nome || "")
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar estoque</DialogTitle>
          <DialogDescription>
            Selecione o recurso e informe a quantidade atual.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSalvar} className="space-y-4">
          <div className="space-y-2">
            <Label>Recurso</Label>
            <Select value={tipoId} onValueChange={setTipoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um recurso" />
              </SelectTrigger>
              <SelectContent>
                {tiposOrdenados.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.nome}
                    {t.unidade_medida ? ` (${t.unidade_medida})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qtd-est">Quantidade atual</Label>
            <Input
              id="qtd-est"
              type="number"
              min={0}
              required
              value={qtd}
              onChange={(e) => setQtd(e.target.value)}
            />
          </div>
          {erro && (
            <p className="text-sm text-destructive" role="alert">
              {erro}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!tipoId || salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ====================================================================
 * TAB NECESSIDADES
 * ==================================================================== */

function TabNecessidades({ abrigoId }) {
  const [necessidades, setNecessidades] = useState(null)
  const [indisponivel, setIndisponivel] = useState(false)
  const [recalculando, setRecalculando] = useState(false)

  const carregar = useCallback(async () => {
    setIndisponivel(false)
    try {
      const data = await api.get(`/necessidades?abrigoId=${abrigoId}`)
      setNecessidades(
        Array.isArray(data) ? data : data?.necessidades || []
      )
    } catch {
      setIndisponivel(true)
      setNecessidades([])
    }
  }, [abrigoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function recalcular() {
    setRecalculando(true)
    try {
      const data = await api.post(`/necessidades/calcular/${abrigoId}`, {})
      setNecessidades(data?.necessidades || [])
      setIndisponivel(false)
      toast.success(`${data?.total ?? 0} necessidade(s) recalculada(s).`)
    } catch (err) {
      toast.error(err.message || "Não foi possível recalcular.")
    } finally {
      setRecalculando(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">Necessidades</CardTitle>
          <CardDescription>
            Projeção do que falta com base em pessoas, estoque e regras de
            consumo.
          </CardDescription>
        </div>
        <Button size="sm" onClick={recalcular} disabled={recalculando}>
          {recalculando ? "Calculando..." : "Recalcular"}
        </Button>
      </CardHeader>
      <CardContent>
        {indisponivel && (
          <Alert className="mb-4">
            <AlertTitle>Listagem em construção</AlertTitle>
            <AlertDescription>
              A rota de listagem ainda está sendo implementada. Use "Recalcular"
              pra ver a projeção mais recente.
            </AlertDescription>
          </Alert>
        )}

        {necessidades === null ? (
          <Skeleton className="h-32 w-full" />
        ) : necessidades.length === 0 ? (
          <EmptyState
            titulo="Nenhuma necessidade calculada"
            descricao="Cadastre pessoas e estoque, depois clique em Recalcular."
            acao={
              <Button onClick={recalcular} disabled={recalculando}>
                Recalcular agora
              </Button>
            }
          />
        ) : (
          <ul className="divide-y">
            {necessidades.map((n) => {
              const dias = diasAteHoje(n.prazo)
              const urgente = dias != null && dias <= 3
              return (
                <li key={n.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {n.tipo_nome || `Recurso #${n.tipo_recurso_id}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Quantidade necessária: {n.qtd_necessaria} · prazo{" "}
                      {formatarData(n.prazo)}
                      {dias != null &&
                        ` (${dias >= 0 ? `em ${dias} dia(s)` : "vencido"})`}
                    </div>
                  </div>
                  {urgente && (
                    <Badge
                      variant="outline"
                      className="bg-destructive/15 text-destructive border-destructive/30"
                    >
                      urgente
                    </Badge>
                  )}
                  <StatusBadge tipo="necessidade" status={n.status} />
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

