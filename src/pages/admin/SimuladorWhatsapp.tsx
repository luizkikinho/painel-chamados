import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { simuladorListar, simuladorEnviar } from "@/lib/simulador"
import {
  Bot,
  Copy,
  Loader2,
  MessageSquareIcon,
  Phone,
  Plus,
  Send,
  User,
} from "lucide-react"

interface BotaoSimulado {
  id: string
  tipo: string
  displayText: string | null
  copyCode: string | null
}

interface LinhaLista {
  id: string
  titulo: string
  descricao: string | null
}

type MensagemSimulada =
  | { direcao: "cidadão" | "bot"; ts: number; tipo: "texto"; texto: string }
  | {
      direcao: "cidadão" | "bot"
      ts: number
      tipo: "buttons"
      titulo: string | null
      descricao: string | null
      rodape: string | null
      botoes: BotaoSimulado[]
    }
  | {
      direcao: "cidadão" | "bot"
      ts: number
      tipo: "list"
      titulo: string | null
      descricao: string | null
      botaoMenu: string | null
      rodape: string | null
      secoes: { titulo: string | null; linhas: LinhaLista[] }[]
    }

interface ConversaSimulada {
  numero: string
  mensagens: MensagemSimulada[]
}

const temTexto = (m: MensagemSimulada): m is Extract<MensagemSimulada, { tipo: "texto" }> =>
  m.tipo === "texto"

const erroMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

function formatarHora(ts: number) {
  return new Date(ts).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatarNumero(numero: string) {
  const limpo = numero.replace(/\D/g, "")
  if (limpo.length <= 2) return numero
  return `+${limpo}`
}

export default function SimuladorWhatsapp() {
  // ===== identidade =====
  const [checking, setChecking] = useState(true)
  const [cargo, setCargo] = useState<string | null>(null)
  const [minhaEmpresaId, setMinhaEmpresaId] = useState<string | null>(null)
  const [empresaSelecionada, setEmpresaSelecionada] = useState("")
  const [empresas, setEmpresas] = useState<{ id: string; name: string }[]>([])

  const empresaId =
    cargo === "super_admin" ? empresaSelecionada : minhaEmpresaId

  // ===== empresa / instância =====
  const [empresa, setEmpresa] = useState<{
    id: string
    name: string
    instance_name: string | null
    whatsapp_status: string | null
    status: boolean
  } | null>(null)

  // ===== conversas =====
  const [conversas, setConversas] = useState<ConversaSimulada[]>([])
  const [numeroSelecionado, setNumeroSelecionado] = useState<string | null>(null)
  const [carregandoConversas, setCarregandoConversas] = useState(false)

  // ===== entrada =====
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [novoNumero, setNovoNumero] = useState("")
  const [criandoConversa, setCriandoConversa] = useState(false)

  const fimDaListaRef = useRef<HTMLDivElement>(null)

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

  const fetchConversas = useCallback(async (empresa: string) => {
    setCarregandoConversas(true)
    try {
      const data = await simuladorListar(empresa)
      setConversas(data?.conversas ?? [])
    } catch (e) {
      toast.error(erroMsg(e))
    } finally {
      setCarregandoConversas(false)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!empresaId) {
        setEmpresa(null)
        setConversas([])
        setNumeroSelecionado(null)
        return
      }
      const { data } = await supabase
        .from("empresas")
        .select("id, name, instance_name, whatsapp_status, status")
        .eq("id", empresaId!)
        .single()
      setEmpresa(data)
      fetchConversas(empresaId)
    }
    load()
  }, [empresaId, fetchConversas])

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [numeroSelecionado, conversas])

  const mensagensSelecionadas =
    conversas.find((c) => c.numero === numeroSelecionado)?.mensagens ?? []

  const atualizarTranscricao = (numero: string, transcricao: MensagemSimulada[]) => {
    setConversas((prev) => {
      const existe = prev.some((c) => c.numero === numero)
      if (existe) {
        return prev.map((c) =>
          c.numero === numero ? { ...c, mensagens: transcricao } : c
        )
      }
      return [...prev, { numero, mensagens: transcricao }]
    })
  }

  const handleEnviar = async (valor?: string) => {
    const numero = numeroSelecionado
    const mensagem = (valor ?? texto).trim()
    if (!empresaId) return toast.error("Selecione uma empresa.")
    if (!numero) return toast.error("Selecione ou crie uma conversa.")
    if (!mensagem) return

    setEnviando(true)
    try {
      const data = await simuladorEnviar({ empresaId, numero, texto: mensagem })
      if (data?.transcricao) atualizarTranscricao(numero, data.transcricao)
      if (data?.erro) throw new Error(data.erro)
      setTexto("")
    } catch (e) {
      toast.error(erroMsg(e))
    } finally {
      setEnviando(false)
    }
  }

  const iniciarNovaConversa = async () => {
    if (!empresaId) return toast.error("Selecione uma empresa.")
    const limpo = novoNumero.replace(/\D/g, "")
    if (limpo.length < 10) {
      return toast.error("Digite um número de telefone válido (ex.: 11912345678)")
    }
    setCriandoConversa(true)
    setNumeroSelecionado(limpo)
    setNovoNumero("")
    try {
      const data = await simuladorEnviar({
        empresaId,
        numero: limpo,
        texto: "/start",
      })
      if (data?.transcricao) atualizarTranscricao(limpo, data.transcricao)
      toast.success("Conversa iniciada. O bot enviou o menu de boas-vindas.")
    } catch (e) {
      toast.error(erroMsg(e))
    } finally {
      setCriandoConversa(false)
    }
  }

  const copiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo)
    toast.success("Protocolo copiado!")
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

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <MessageSquareIcon className="h-6 w-6" />
            Simulador WhatsApp
          </h1>
          <p className="text-sm text-muted-foreground">
            Digite como um cidadão e veja o bot reagir — sem Evolution, sem
            WhatsApp real.
          </p>
        </div>

        {cargo === "super_admin" && (
          <Select value={empresaSelecionada} onValueChange={setEmpresaSelecionada}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Simular qual empresa?" />
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

      {empresaId && !empresa?.instance_name && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Esta empresa ainda não possui instância. Crie ou conecte pelo{" "}
            <span className="font-semibold text-foreground">
              WhatsApp Bot
            </span>{" "}
            antes de simular (em modo mock a conexão é instantânea).
          </CardContent>
        </Card>
      )}

      <div className="grid h-full min-h-0 grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
        {/* ===== Conversas (desktop) ===== */}
        <Card className="hidden min-h-0 flex-col md:flex">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-3">
            <NovaConversa
              criando={criandoConversa}
              disabled={!empresaId}
              numero={novoNumero}
              setNumero={setNovoNumero}
              onCriar={iniciarNovaConversa}
            />
            <ListaConversas
              carregando={carregandoConversas}
              conversas={conversas}
              selecionado={numeroSelecionado}
              onSelecionar={setNumeroSelecionado}
            />
          </CardContent>
        </Card>

        {/* ===== Conversas (mobile) ===== */}
        <div className="flex min-h-0 flex-col gap-2 md:hidden">
          <NovaConversa
            criando={criandoConversa}
            disabled={!empresaId}
            numero={novoNumero}
            setNumero={setNovoNumero}
            onCriar={iniciarNovaConversa}
          />
          <ListaConversas
            carregando={carregandoConversas}
            conversas={conversas}
            selecionado={numeroSelecionado}
            onSelecionar={setNumeroSelecionado}
            horizontal
          />
        </div>

        {/* ===== Chat ===== */}
        <Card className="flex min-h-0 flex-col">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            {/* Cabeçalho da conversa */}
            <div className="flex items-center justify-between gap-2 border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="flex aspect-square size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    {numeroSelecionado
                      ? formatarNumero(numeroSelecionado)
                      : "Nenhuma conversa selecionada"}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {empresa?.name ?? "—"}
                    {empresa?.whatsapp_status && (
                      <Badge
                        variant={
                          empresa.whatsapp_status === "connected"
                            ? "default"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {empresa.whatsapp_status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Badge variant="outline">Modo simulação (mock)</Badge>
            </div>

            {/* Mensagens */}
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-md bg-muted/30 p-3">
              <DividerMensagem texto="Início da conversa" />

              {mensagensSelecionadas.map((m, i) =>
                temTexto(m) ? (
                  <BolhaTexto key={i} mensagem={m} />
                ) : m.tipo === "buttons" ? (
                  <BolhaBotoes
                    key={i}
                    mensagem={m}
                    onOpcao={(id) => handleEnviar(id)}
                    onCopiar={copiarCodigo}
                  />
                ) : (
                  <BolhaLista
                    key={i}
                    mensagem={m}
                    onOpcao={(id) => handleEnviar(id)}
                  />
                )
              )}

              {numeroSelecionado && mensagensSelecionadas.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Envie uma mensagem abaixo para iniciar.
                </p>
              )}

              <div ref={fimDaListaRef} />
            </div>

            {/* Entrada */}
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                handleEnviar()
              }}
            >
              <Textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Digite como o cidadão (ex.: /start, 1, seu relato...)"
                disabled={!empresaId || !numeroSelecionado || enviando}
                className="max-h-32 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleEnviar()
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!empresaId || !numeroSelecionado || enviando}
                title="Enviar"
              >
                {enviando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ListaConversas({
  conversas,
  selecionado,
  carregando,
  onSelecionar,
  horizontal = false,
}: {
  conversas: ConversaSimulada[]
  selecionado: string | null
  carregando: boolean
  onSelecionar: (numero: string) => void
  horizontal?: boolean
}) {
  if (carregando) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Carregando conversas...
      </p>
    )
  }
  if (conversas.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Nenhuma conversa ainda. Crie uma para começar.
      </p>
    )
  }
  return (
    <div
      className={cn(
        "flex gap-1.5",
        horizontal ? "flex-row overflow-x-auto pb-1" : "min-h-0 flex-1 flex-col overflow-y-auto"
      )}
    >
      {conversas.map((c) => (
        <button
          key={c.numero}
          onClick={() => onSelecionar(c.numero)}
          className={cn(
            "flex items-center gap-2 rounded-lg border p-2 text-left text-sm transition-colors hover:bg-muted/50",
            horizontal ? "shrink-0" : "w-full",
            selecionado === c.numero && "bg-muted"
          )}
        >
          <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="truncate font-medium">{formatarNumero(c.numero)}</div>
            <div className="truncate text-xs text-muted-foreground">
              {c.mensagens.length} mensagens
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

function NovaConversa({
  numero,
  setNumero,
  onCriar,
  criando,
  disabled,
}: {
  numero: string
  setNumero: (v: string) => void
  onCriar: () => void
  criando: boolean
  disabled: boolean
}) {
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        onCriar()
      }}
    >
      <Input
        value={numero}
        onChange={(e) => setNumero(e.target.value)}
        placeholder="Novo número (ex.: 119...)"
        disabled={disabled || criando}
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || criando}
        title="Nova conversa"
      >
        {criando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </form>
  )
}

function DividerMensagem({ texto }: { texto: string }) {
  return (
    <div className="my-1 flex justify-center">
      <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-medium text-muted-foreground">
        {texto}
      </span>
    </div>
  )
}

function BolhaTexto({
  mensagem,
}: {
  mensagem: Extract<MensagemSimulada, { tipo: "texto" }>
}) {
  const doCidadao = mensagem.direcao === "cidadão"
  return (
    <div className={cn("flex", doCidadao ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow-sm",
          doCidadao
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-background text-foreground border"
        )}
      >
        {mensagem.texto}
        <div
          className={cn(
            "mt-1 text-right text-[10px]",
            doCidadao ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {formatarHora(mensagem.ts)}
        </div>
      </div>
    </div>
  )
}

function BolhaBotoes({
  mensagem,
  onOpcao,
  onCopiar,
}: {
  mensagem: Extract<MensagemSimulada, { tipo: "buttons" }>
  onOpcao: (id: string) => void
  onCopiar: (codigo: string) => void
}) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border bg-background p-3 shadow-sm">
        {(mensagem.titulo || mensagem.descricao) && (
          <div className="mb-2 space-y-1 text-sm">
            {mensagem.titulo && (
              <div className="font-semibold">{mensagem.titulo}</div>
            )}
            {mensagem.descricao && (
              <div className="text-muted-foreground">{mensagem.descricao}</div>
            )}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          {mensagem.botoes.map((b, i) =>
            b.tipo === "copy" && b.copyCode ? (
              <Button
                key={i}
                type="button"
                variant="outline"
                size="sm"
                className="justify-between gap-2"
                onClick={() => onCopiar(b.copyCode!)}
              >
                <span>{b.displayText ?? "Copiar"}</span>
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            ) : (
              <Button
                key={i}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onOpcao(b.id)}
              >
                {b.displayText ?? b.id}
              </Button>
            )
          )}
        </div>
        {mensagem.rodape && (
          <div className="mt-2 text-center text-[10px] text-muted-foreground">
            {mensagem.rodape}
          </div>
        )}
        <div className="mt-1 text-right text-[10px] text-muted-foreground">
          {formatarHora(mensagem.ts)}
        </div>
      </div>
    </div>
  )
}

function BolhaLista({
  mensagem,
  onOpcao,
}: {
  mensagem: Extract<MensagemSimulada, { tipo: "list" }>
  onOpcao: (id: string) => void
}) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border bg-background p-3 shadow-sm">
        {(mensagem.titulo || mensagem.descricao) && (
          <div className="mb-2 space-y-1 text-sm">
            {mensagem.titulo && (
              <div className="font-semibold">{mensagem.titulo}</div>
            )}
            {mensagem.descricao && (
              <div className="text-muted-foreground">{mensagem.descricao}</div>
            )}
          </div>
        )}
        {mensagem.secoes.map((s, si) => (
          <div key={si} className="mb-2">
            {s.titulo && (
              <div className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                {s.titulo}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              {s.linhas.map((l, li) => (
                <Button
                  key={li}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto justify-start py-2"
                  onClick={() => onOpcao(l.id)}
                >
                  {l.titulo}
                </Button>
              ))}
            </div>
          </div>
        ))}
        {mensagem.botaoMenu && (
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
            <Bot className="h-3.5 w-3.5" />
            {mensagem.botaoMenu}
          </div>
        )}
        <div className="mt-1 text-right text-[10px] text-muted-foreground">
          {formatarHora(mensagem.ts)}
        </div>
      </div>
    </div>
  )
}