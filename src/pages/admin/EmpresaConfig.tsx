import { useCallback, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { UserContext } from "@/lib/user-context"
import { toast } from "sonner"
import { Loader2, Save, Building2, QrCode, CheckCircle2 } from "lucide-react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EmpresaInfo {
  id: string
  name: string
  status: boolean
  created_at: string
  instance_name: string | null
  whatsapp_status: string | null
}

interface EmpresaOption {
  id: string
  name: string
}

export default function EmpresaConfig() {
  const { userProfile, setUserProfile } = useContext(UserContext) ?? {}
  const [checking, setChecking] = useState(true)
  const [cargo, setCargo] = useState<string | null>(null)
  const [minhaEmpresaId, setMinhaEmpresaId] = useState<string | null>(null)

  const [empresas, setEmpresas] = useState<EmpresaOption[]>([])
  const [empresaSelecionada, setEmpresaSelecionada] = useState("")

  const empresaId =
    cargo === "super_admin" ? empresaSelecionada : minhaEmpresaId

  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null)
  const [nome, setNome] = useState("")
  const [saving, setSaving] = useState(false)

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

  const fetchEmpresa = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("empresas")
      .select("id, name, status, created_at, instance_name, whatsapp_status")
      .eq("id", id)
      .single()
    setEmpresa((data as EmpresaInfo | null) ?? null)
    setNome((data?.name as string | undefined) ?? "")
  }, [])

  useEffect(() => {
    if (empresaId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchEmpresa(empresaId)
    }
  }, [empresaId, fetchEmpresa])

  const handleSave = async () => {
    if (!empresaId || !nome.trim()) return toast.error("Informe o nome.")
    setSaving(true)
    try {
      const { error } = await supabase
        .from("empresas")
        .update({ name: nome.trim() })
        .eq("id", empresaId)
      if (error) throw new Error(error.message)
      toast.success("Informações da empresa salvas.")
      setUserProfile?.(
        userProfile
          ? { ...userProfile, empresaNome: nome.trim() }
          : null
      )
      void fetchEmpresa(empresaId)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!empresaId || !empresa) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from("empresas")
        .update({ status: !empresa.status })
        .eq("id", empresaId)
      if (error) throw new Error(error.message)
      toast.success(empresa.status ? "Empresa desativada." : "Empresa ativada.")
      void fetchEmpresa(empresaId)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

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

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Configurar Empresa
        </h1>
        <p className="text-sm text-muted-foreground">
          Dados cadastrais e exibição no cabeçalho do painel.
        </p>
        {cargo === "super_admin" && (
          <Select value={empresaSelecionada} onValueChange={setEmpresaSelecionada}>
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>Informações da Empresa</CardTitle>
            </div>
            <CardDescription>
              O nome salvo aqui aparece no cabeçalho do painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="empresa-nome">Nome da empresa</Label>
              <Input
                id="empresa-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={!empresaId || saving}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Situação</div>
                <Badge variant={empresa?.status ? "default" : "secondary"}>
                  {empresa?.status ? "Ativa" : "Desativada"}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!empresaId || saving}
                onClick={handleToggleStatus}
              >
                {empresa?.status ? "Desativar" : "Ativar"}
              </Button>
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={!empresaId || saving || !nome.trim()}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar alterações
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              <CardTitle>Conexão WhatsApp</CardTitle>
            </div>
            <CardDescription>
              Status da instância do bot (gerenciado pelo backend).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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

            <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Edite as mensagens do bot e as categorias de denúncia em
              <strong>WhatsApp Bot</strong>.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}