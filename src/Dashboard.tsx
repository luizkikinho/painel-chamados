import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Topbar } from "./Topbar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Clock, ShieldAlert, CheckCircle2, Lock } from "lucide-react"

interface Chamado {
  id: string
  texto: string
  permissao_compartilhar: boolean
  data: string
  status: string
  agente_responsavel_id: string | null
  protocol: string
  empresa_id: string
  categoria_id: string
}

export default function Dashboard() {
  const [chamados, setChamados] = useState<Chamado[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [adminId, setAdminId] = useState<string | null>(null)

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [chamadoParaAtribuir, setChamadoParaAtribuir] = useState<string | null>(
    null
  )
  const [isAssigning, setIsAssigning] = useState(false)

  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
  const [chamadoAtivo, setChamadoAtivo] = useState<Chamado | null>(null)
  const [respostaTexto, setRespostaTexto] = useState("")
  const [isReplying, setIsReplying] = useState(false)

  useEffect(() => {
    const carregarDashboard = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      setAdminId(user.id)

      const { data: adminData } = await supabase
        .from("administradores")
        .select("empresa_id")
        .eq("id", user.id)
        .single()

      if (!adminData?.empresa_id) {
        setIsLoading(false)
        return
      }

      const { data: chamadosData } = await supabase
        .from("chamados_painel")
        .select("*")
        .eq("empresa_id", adminData.empresa_id)
        .order("data", { ascending: false })

      if (chamadosData) {
        setChamados(chamadosData as Chamado[]) // O código volta a ser direto assim!
      }
      setIsLoading(false)
    }
    carregarDashboard()
  }, [])

  const abrirConfirmacaoAtribuicao = (idChamado: string) => {
    setChamadoParaAtribuir(idChamado)
    setIsAssignDialogOpen(true)
  }

  const confirmarAtribuicao = async () => {
    if (!chamadoParaAtribuir || !adminId) return
    setIsAssigning(true)

    const { error: updateError } = await supabase
      .from("chamados")
      .update({ agente_responsavel_id: adminId, status: "em_andamento" })
      .eq("id", chamadoParaAtribuir)

    if (!updateError) {
      await supabase.from("registro_chamados").insert({
        id_chamado: chamadoParaAtribuir,
        usuario_chamado: adminId,
        tipo_acao: "ATRIBUICAO_AGENTE",
        texto: "O agente assumiu a responsabilidade por este chamado.",
      })

      // Busca a denúncia real
      const { data: chamadoAtualizado } = await supabase
        .from("chamados")
        .select(
          "id, protocol, status, data, permissao_compartilhar, agente_responsavel_id, empresa_id, categoria_id, texto_seguro"
        )
        .eq("id", chamadoParaAtribuir)
        .single()

      // Atualiza o estado apenas com os dados reais recém-buscados
      if (chamadoAtualizado) {
        setChamados((prev) =>
          prev.map((c) =>
            c.id === chamadoParaAtribuir
              ? ({
                  ...chamadoAtualizado,
                  texto: chamadoAtualizado.texto_seguro,
                } as Chamado)
              : c
          )
        )
      }
    } // Aqui fecha o if principal perfeitamente

    setIsAssigning(false)
    setIsAssignDialogOpen(false)
    setChamadoParaAtribuir(null)
  }

  const abrirDetalhesResposta = (chamado: Chamado) => {
    setChamadoAtivo(chamado)
    setRespostaTexto("")
    setIsReplyDialogOpen(true)
  }

  const confirmarResposta = async () => {
    if (!chamadoAtivo || !adminId || !respostaTexto.trim()) return
    setIsReplying(true)

    const { error: updateError } = await supabase
      .from("chamados")
      .update({ status: "concluido" })
      .eq("id", chamadoAtivo.id)

    if (!updateError) {
      await supabase.from("registro_chamados").insert({
        id_chamado: chamadoAtivo.id,
        usuario_chamado: adminId,
        tipo_acao: "RESPOSTA_CONCLUSAO",
        texto: respostaTexto,
      })
      setChamados((prev) =>
        prev.map((c) =>
          c.id === chamadoAtivo.id ? { ...c, status: "concluido" } : c
        )
      )
    }
    setIsReplying(false)
    setIsReplyDialogOpen(false)
    setChamadoAtivo(null)
  }

  const chamadosAbertos = chamados.filter((c) =>
    ["aberto", "novo", "pendente", ""].includes(
      (c.status || "").toLowerCase().trim()
    )
  )
  const chamadosEmAndamento = chamados.filter((c) =>
    ["em_andamento", "em andamento"].includes(
      (c.status || "").toLowerCase().trim()
    )
  )
  const chamadosConcluidos = chamados.filter((c) =>
    ["concluido", "concluído", "fechado"].includes(
      (c.status || "").toLowerCase().trim()
    )
  )

  const formatarData = (dataIso: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dataIso))
  }

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        Carregando painel...
      </div>
    )

  return (
    // NOVO: O Tabs agora envolve a tela inteira (min-h-screen)
    <Tabs
      defaultValue="abertos"
      className="flex min-h-screen flex-col bg-muted/20"
    >
      {/* O Topbar recebe o TabsList como filho */}
      <Topbar>
        <TabsList className="grid h-10 w-full max-w-[600px] min-w-[320px] grid-cols-3 md:h-11">
          <TabsTrigger
            value="abertos"
            className="flex gap-1.5 text-xs data-[state=active]:text-red-600 md:gap-2 md:text-sm dark:data-[state=active]:text-red-400"
          >
            <ShieldAlert className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Triagem</span>
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 md:text-xs dark:bg-red-950 dark:text-red-400">
              {chamadosAbertos.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="andamento"
            className="flex gap-1.5 text-xs data-[state=active]:text-blue-600 md:gap-2 md:text-sm dark:data-[state=active]:text-blue-400"
          >
            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Em Andamento</span>
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 md:text-xs dark:bg-blue-950 dark:text-blue-400">
              {chamadosEmAndamento.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="concluidos"
            className="flex gap-1.5 text-xs data-[state=active]:text-green-600 md:gap-2 md:text-sm dark:data-[state=active]:text-green-400"
          >
            <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Concluídos</span>
            <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700 md:text-xs dark:bg-green-950 dark:text-green-400">
              {chamadosConcluidos.length}
            </span>
          </TabsTrigger>
        </TabsList>
      </Topbar>

      <main className="mx-auto w-full max-w-7xl flex-1 p-6 md:p-8">
        {/* ABA 1: ABERTOS */}
        <TabsContent value="abertos" className="m-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3">
            {chamadosAbertos.map((chamado) => (
              <Card
                key={chamado.id}
                className="border-l-4 border-l-red-500 shadow-sm"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="font-mono text-sm text-muted-foreground">
                      #{chamado.protocol}
                    </CardTitle>
                    {!chamado.permissao_compartilhar && (
                      <Lock
                        className="h-4 w-4 text-muted-foreground"
                        aria-label="Sigilo Absoluto"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="mb-3 flex flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 p-4 text-muted-foreground">
                    <Lock className="mb-2 h-5 w-5 opacity-50" />
                    <p className="text-center text-sm font-medium">
                      Conteúdo em sigilo.
                      <br />
                      Atribua-se para ler.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatarData(chamado.data)}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    className="w-full bg-red-600 text-white hover:bg-red-700"
                    onClick={() => abrirConfirmacaoAtribuicao(chamado.id)}
                  >
                    Atribuir a mim
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {chamadosAbertos.length === 0 && (
              <p className="col-span-full text-muted-foreground">
                Nenhuma denúncia aguardando triagem.
              </p>
            )}
          </div>
        </TabsContent>

        {/* ABA 2: EM ANDAMENTO */}
        <TabsContent
          value="andamento"
          className="m-0 focus-visible:outline-none"
        >
          <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3">
            {chamadosEmAndamento.map((chamado) => (
              <Card
                key={chamado.id}
                className="flex flex-col border-l-4 border-l-blue-500 shadow-sm"
              >
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="font-mono text-sm text-muted-foreground">
                    #{chamado.protocol}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-4 pt-0">
                  {chamado.agente_responsavel_id === adminId ? (
                    <p className="mb-3 line-clamp-4 text-sm">{chamado.texto}</p>
                  ) : (
                    <div className="mb-3 flex flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 p-4 text-muted-foreground">
                      <Lock className="mb-2 h-5 w-5 opacity-50" />
                      <p className="text-center text-sm font-medium">
                        Conteúdo restrito ao
                        <br />
                        agente responsável.
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatarData(chamado.data)}
                  </p>
                </CardContent>
                <CardFooter className="mt-auto p-4 pt-0">
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={chamado.agente_responsavel_id !== adminId}
                    onClick={() => abrirDetalhesResposta(chamado)}
                  >
                    Abrir Detalhes
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {chamadosEmAndamento.length === 0 && (
              <p className="col-span-full text-muted-foreground">
                Nenhum chamado em andamento.
              </p>
            )}
          </div>
        </TabsContent>

        {/* ABA 3: CONCLUÍDOS */}
        <TabsContent
          value="concluidos"
          className="m-0 focus-visible:outline-none"
        >
          <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3">
            {chamadosConcluidos.map((chamado) => (
              <Card
                key={chamado.id}
                className="border-l-4 border-l-green-500 opacity-75 shadow-sm"
              >
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="font-mono text-sm text-muted-foreground">
                    #{chamado.protocol}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {chamado.agente_responsavel_id === adminId ? (
                    <p className="mb-3 line-clamp-3 text-sm">{chamado.texto}</p>
                  ) : (
                    <div className="mb-3 flex flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 p-3 text-muted-foreground">
                      <Lock className="mb-1 h-4 w-4 opacity-50" />
                      <p className="text-center text-xs font-medium">
                        Conteúdo restrito ao
                        <br />
                        agente responsável.
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatarData(chamado.data)}
                  </p>
                </CardContent>
              </Card>
            ))}
            {chamadosConcluidos.length === 0 && (
              <p className="col-span-full text-muted-foreground">
                Nenhum chamado concluído.
              </p>
            )}
          </div>
        </TabsContent>
      </main>

      {/* Modais omitidos para brevidade - Mantenha exatamente o mesmo código da sua AlertDialog e Dialog anteriores aqui em baixo */}
      <AlertDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="h-5 w-5" />
              Atenção: Ação Irreversível
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Ao se atribuir a esta denúncia, você passará a ser o{" "}
              <strong>único operador responsável</strong> pela sua condução. Por
              questões de auditoria e segurança, esta ação será registrada no
              histórico e não poderá ser desfeita.
              <br />
              <br />
              Deseja assumir a responsabilidade por este chamado?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAssigning}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarAtribuicao}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isAssigning}
            >
              {isAssigning ? "Atribuindo..." : "Sim, assumir chamado"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              Ticket #{chamadoAtivo?.protocol}
            </DialogTitle>
            <DialogDescription>
              Aberto em {chamadoAtivo && formatarData(chamadoAtivo.data)}
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-4">
            <div className="rounded-md border bg-muted p-4 text-sm">
              <h4 className="mb-2 flex items-center gap-2 font-semibold">
                Relato Original
                {!chamadoAtivo?.permissao_compartilhar && (
                  <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-red-700 uppercase">
                    <Lock className="h-3 w-3" /> Sigilo Absoluto
                  </span>
                )}
              </h4>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {chamadoAtivo?.texto}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">
                Adicionar Resposta / Conclusão
              </h4>
              <Textarea
                placeholder="Descreva as ações tomadas e a resolução deste caso. Esta mensagem será registrada no histórico."
                className="min-h-[120px] resize-none"
                value={respostaTexto}
                onChange={(e) => setRespostaTexto(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReplyDialogOpen(false)}
              disabled={isReplying}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarResposta}
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={isReplying || !respostaTexto.trim()}
            >
              {isReplying ? "Salvando..." : "Registrar e Concluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
