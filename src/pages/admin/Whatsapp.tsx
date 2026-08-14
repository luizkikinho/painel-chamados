import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { QrCode, Loader2, Pencil, Check, X, Power, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function WhatsappBot() {
  // ===== identidade =====
  const [checking, setChecking] = useState(true)
  const [cargo, setCargo] = useState<string | null>(null)
  const [minhaEmpresaId, setMinhaEmpresaId] = useState<string | null>(null)
  const [empresaSelecionada, setEmpresaSelecionada] = useState("") // super_admin
  const [empresas, setEmpresas] = useState<any[]>([])

  const empresaId =
    cargo === "super_admin" ? empresaSelecionada : minhaEmpresaId

  // ===== empresa (conexão) =====
  const [empresa, setEmpresa] = useState<any>(null)

  // ===== QR =====
  const [qrOpen, setQrOpen] = useState(false)
  const [qrBase64, setQrBase64] = useState("")
  const [connecting, setConnecting] = useState(false)

  // ===== categorias =====
  const [categorias, setCategorias] = useState<any[]>([])
  const [novoNome, setNovoNome] = useState("")
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setChecking(false)
        return
      }
      const { data } = await supabase
        .from("administradores")
        .select("cargo, empresa_id")
        .eq("id", user.id)
        .single()
      setCargo(data?.cargo ?? null)
      setMinhaEmpresaId(data?.empresa_id ?? null)
      if (data?.cargo === "super_admin") {
        const { data: emps } = await supabase
          .from("empresas")
          .select("id, name")
          .order("name")
        setEmpresas(emps ?? [])
      }
      setChecking(false)
    }
    load()
  }, [])

  const fetchEmpresa = async () => {
    if (!empresaId) return setEmpresa(null)
    const { data } = await supabase
      .from("empresas")
      .select("id, name, instance_name, whatsapp_status")
      .eq("id", empresaId)
      .single()
    setEmpresa(data)
  }

  const fetchCategorias = async () => {
    if (!empresaId) return setCategorias([])
    const { data } = await supabase
      .from("categorias")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("name")
    setCategorias(data ?? [])
  }

  useEffect(() => {
    if (empresaId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchEmpresa()
      fetchCategorias()
    }
  }, [empresaId])

  // ===== handlers =====
  const handleConnect = async () => {
    if (!empresaId) return toast.error("Selecione uma empresa.")
    setConnecting(true)
    try {
      const { data, error } = await supabase.functions.invoke(
        "get-qr-empresa",
        {
          body: { empresaId },
        }
      )
      if (error) throw new Error(error.message)
      setQrBase64(data.qrBase64 ?? "")
      setQrOpen(true)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setConnecting(false)
    }
  }

  const handleCreateCategoria = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const { error } = await supabase
        .from("categorias")
        .insert({ name: novoNome.trim(), empresa_id: empresaId, active: true })
      if (error) throw new Error(error.message)
      toast.success("Categoria criada.")
      setNovoNome("")
      fetchCategorias()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleRename = async (cat: any) => {
    try {
      const { error } = await supabase
        .from("categorias")
        .update({ name: editName.trim() })
        .eq("id", cat.id)
      if (error) throw new Error(error.message)
      toast.success("Categoria renomeada.")
      setEditingId(null)
      fetchCategorias()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleToggle = async (cat: any) => {
    setTogglingId(cat.id)
    try {
      const { error } = await supabase
        .from("categorias")
        .update({ active: !cat.active })
        .eq("id", cat.id)
      if (error) throw new Error(error.message)
      toast.success(cat.active ? "Categoria desativada." : "Categoria ativada.")
      fetchCategorias()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setTogglingId(null)
    }
  }

  // ===== gates =====
  if (checking) return <div className="p-8">Verificando acesso...</div>
  if (cargo !== "master" && cargo !== "super_admin") {
    return <div className="p-8 text-muted-foreground">Acesso restrito.</div>
  }
  if (cargo === "master" && !minhaEmpresaId) {
    return (
      <div className="p-8 text-muted-foreground">
        Sua conta não possui empresa vinculada.
      </div>
    )
  }

  const qrSrc = qrBase64?.startsWith("data:")
    ? qrBase64
    : `data:image/png;base64,${qrBase64}`

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          WhatsApp Bot
        </h1>
        <p className="text-sm text-muted-foreground">
          Conexão, catálogo e voz do assistente da sua empresa.
        </p>
        {cargo === "super_admin" && (
          <Select
            value={empresaSelecionada}
            onValueChange={setEmpresaSelecionada}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Gerenciar qual empresa?" />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* ===== Conexão ===== */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              <CardTitle>Conexão</CardTitle>
            </div>
            <CardDescription>
              {empresa?.name ?? "Selecione uma empresa para começar."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-1">
                <div className="text-sm capitalize">
                  {empresa?.whatsapp_status ?? "—"}
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {empresa?.instance_name ?? "sem instância"}
                </div>
              </div>
              <Badge
                variant={
                  empresa?.whatsapp_status === "connected"
                    ? "default"
                    : "secondary"
                }
              >
                {empresa?.whatsapp_status === "connected"
                  ? "Conectado"
                  : "Desconectado"}
              </Badge>
            </div>
            <Button
              className="w-full"
              onClick={handleConnect}
              disabled={connecting || !empresaId || empresa?.status === false}
            >
              {connecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-4 w-4" />
              )}
              {connecting ? "Gerando QR..." : "Conectar WhatsApp"}
            </Button>
          </CardContent>
        </Card>

        {/* ===== Categorias ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Categorias de denúncia</CardTitle>
            <CardDescription>
              O que o bot oferece no menu. Desativadas somem do bot, mas ficam
              no histórico.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCreateCategoria} className="flex gap-2">
              <Input
                placeholder="Nova categoria"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                required
                disabled={!empresaId || creating}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!empresaId || creating}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </form>

            <div className="space-y-2">
              {categorias.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-2"
                >
                  {editingId === cat.id ? (
                    <>
                      <Input
                        className="h-8"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRename(cat)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm">{cat.name}</span>
                        <Badge variant={cat.active ? "default" : "secondary"}>
                          {cat.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(cat.id)
                            setEditName(cat.name)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={togglingId === cat.id}
                          onClick={() => handleToggle(cat)}
                          title={cat.active ? "Desativar" : "Ativar"}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {categorias.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma categoria ainda.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Dialog QR ===== */}
      <Dialog
        open={qrOpen}
        onOpenChange={(open) => {
          setQrOpen(open)
          if (!open) fetchEmpresa()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Conectar WhatsApp — {empresa?.instance_name}
            </DialogTitle>
            <DialogDescription>
              Escaneie com o WhatsApp da empresa para vincular a instância.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {qrBase64 ? (
              <img
                src={qrSrc}
                alt="QR Code da instância"
                className="h-52 w-52 rounded-lg border sm:h-64 sm:w-64"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                QR não disponível.
              </p>
            )}
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setQrOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
