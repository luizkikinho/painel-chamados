import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Topbar } from "./Topbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
  const [chamadoParaAtribuir, setChamadoParaAtribuir] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)

  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
  const [chamadoAtivo, setChamadoAtivo] = useState<Chamado | null>(null)
  const [respostaTexto, setRespostaTexto] = useState("")
  const [isReplying, setIsReplying] = useState(false)

  useEffect(() => {
    const carregarDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setAdminId(user.id)

      const { data: adminData } = await supabase
        .from('administradores')
        .select('empresa_id')
        .eq('id', user.id)
        .single()

      if (!adminData?.empresa_id) {
        setIsLoading(false)
        return
      }

      const { data: chamadosData } = await supabase
        .from('chamados')
        .select('*')
        .eq('empresa_id', adminData.empresa_id)
        .order('data', { ascending: false })

      if (chamadosData) setChamados(chamadosData)
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
      .from('chamados')
      .update({ agente_responsavel_id: adminId, status: 'em_andamento' })
      .eq('id', chamadoParaAtribuir)

    if (!updateError) {
      await supabase.from('registro_chamados').insert({
        id_chamado: chamadoParaAtribuir,
        usuario_chamado: adminId,
        tipo_acao: 'ATRIBUICAO_AGENTE',
        texto: 'O agente assumiu a responsabilidade por este chamado.'
      })

      setChamados(prev => prev.map(c => 
        c.id === chamadoParaAtribuir ? { ...c, agente_responsavel_id: adminId, status: 'em_andamento' } : c
      ))
    }
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
      .from('chamados')
      .update({ status: 'concluido' })
      .eq('id', chamadoAtivo.id)

    if (!updateError) {
      await supabase.from('registro_chamados').insert({
        id_chamado: chamadoAtivo.id,
        usuario_chamado: adminId,
        tipo_acao: 'RESPOSTA_CONCLUSAO',
        texto: respostaTexto
      })
      setChamados(prev => prev.map(c => c.id === chamadoAtivo.id ? { ...c, status: 'concluido' } : c))
    }
    setIsReplying(false)
    setIsReplyDialogOpen(false)
    setChamadoAtivo(null)
  }

  const chamadosAbertos = chamados.filter(c => ['aberto', 'novo', 'pendente', ''].includes((c.status || '').toLowerCase().trim()))
  const chamadosEmAndamento = chamados.filter(c => ['em_andamento', 'em andamento'].includes((c.status || '').toLowerCase().trim()))
  const chamadosConcluidos = chamados.filter(c => ['concluido', 'concluído', 'fechado'].includes((c.status || '').toLowerCase().trim()))

  const formatarData = (dataIso: string) => {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dataIso))
  }

  if (isLoading) return <div className="flex h-screen items-center justify-center">Carregando painel...</div>

  return (
    // NOVO: O Tabs agora envolve a tela inteira (min-h-screen)
    <Tabs defaultValue="abertos" className="min-h-screen bg-muted/20 flex flex-col">
      
      {/* O Topbar recebe o TabsList como filho */}
      <Topbar>
        <TabsList className="grid w-full min-w-[320px] max-w-[600px] grid-cols-3 h-10 md:h-11">
          <TabsTrigger value="abertos" className="flex gap-1.5 md:gap-2 text-xs md:text-sm data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400">
            <ShieldAlert className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Triagem</span>
            <span className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold">{chamadosAbertos.length}</span>
          </TabsTrigger>
          <TabsTrigger value="andamento" className="flex gap-1.5 md:gap-2 text-xs md:text-sm data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">
            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Em Andamento</span>
            <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold">{chamadosEmAndamento.length}</span>
          </TabsTrigger>
          <TabsTrigger value="concluidos" className="flex gap-1.5 md:gap-2 text-xs md:text-sm data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Concluídos</span>
            <span className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold">{chamadosConcluidos.length}</span>
          </TabsTrigger>
        </TabsList>
      </Topbar>

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {/* ABA 1: ABERTOS */}
        <TabsContent value="abertos" className="m-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {chamadosAbertos.map(chamado => (
              <Card key={chamado.id} className="shadow-sm border-l-4 border-l-red-500">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-mono text-muted-foreground">#{chamado.protocol}</CardTitle>
                    {!chamado.permissao_compartilhar && <Lock className="h-4 w-4 text-muted-foreground" aria-label="Sigilo Absoluto" />}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-col items-center justify-center p-4 mb-3 bg-muted/40 rounded-md border border-dashed border-muted-foreground/30 text-muted-foreground">
                    <Lock className="h-5 w-5 mb-2 opacity-50" />
                    <p className="text-sm text-center font-medium">Conteúdo em sigilo.<br/>Atribua-se para ler.</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatarData(chamado.data)}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => abrirConfirmacaoAtribuicao(chamado.id)}>Atribuir a mim</Button>
                </CardFooter>
              </Card>
            ))}
            {chamadosAbertos.length === 0 && <p className="text-muted-foreground col-span-full">Nenhuma denúncia aguardando triagem.</p>}
          </div>
        </TabsContent>

        {/* ABA 2: EM ANDAMENTO */}
        <TabsContent value="andamento" className="m-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {chamadosEmAndamento.map(chamado => (
              <Card key={chamado.id} className="shadow-sm border-l-4 border-l-blue-500 flex flex-col">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-mono text-muted-foreground">#{chamado.protocol}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1">
                  {chamado.agente_responsavel_id === adminId ? (
                    <p className="text-sm line-clamp-4 mb-3">{chamado.texto}</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 mb-3 bg-muted/40 rounded-md border border-dashed border-muted-foreground/30 text-muted-foreground">
                      <Lock className="h-5 w-5 mb-2 opacity-50" />
                      <p className="text-sm text-center font-medium">Conteúdo restrito ao<br/>agente responsável.</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{formatarData(chamado.data)}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 mt-auto">
                  <Button className="w-full" variant="outline" disabled={chamado.agente_responsavel_id !== adminId} onClick={() => abrirDetalhesResposta(chamado)}>Abrir Detalhes</Button>
                </CardFooter>
              </Card>
            ))}
            {chamadosEmAndamento.length === 0 && <p className="text-muted-foreground col-span-full">Nenhum chamado em andamento.</p>}
          </div>
        </TabsContent>

        {/* ABA 3: CONCLUÍDOS */}
        <TabsContent value="concluidos" className="m-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {chamadosConcluidos.map(chamado => (
              <Card key={chamado.id} className="shadow-sm border-l-4 border-l-green-500 opacity-75">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-mono text-muted-foreground">#{chamado.protocol}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {chamado.agente_responsavel_id === adminId ? (
                    <p className="text-sm line-clamp-3 mb-3">{chamado.texto}</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 mb-3 bg-muted/40 rounded-md border border-dashed border-muted-foreground/30 text-muted-foreground">
                      <Lock className="h-4 w-4 mb-1 opacity-50" />
                      <p className="text-xs text-center font-medium">Conteúdo restrito ao<br/>agente responsável.</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{formatarData(chamado.data)}</p>
                </CardContent>
              </Card>
            ))}
            {chamadosConcluidos.length === 0 && <p className="text-muted-foreground col-span-full">Nenhum chamado concluído.</p>}
          </div>
        </TabsContent>
      </main>

      {/* Modais omitidos para brevidade - Mantenha exatamente o mesmo código da sua AlertDialog e Dialog anteriores aqui em baixo */}
      <AlertDialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Atenção: Ação Irreversível
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Ao se atribuir a esta denúncia, você passará a ser o <strong>único operador responsável</strong> pela sua condução. Por questões de auditoria e segurança, esta ação será registrada no histórico e não poderá ser desfeita.
              <br /><br />
              Deseja assumir a responsabilidade por este chamado?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAssigning}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmarAtribuicao} 
              className="bg-red-600 hover:bg-red-700 text-white"
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
            <div className="bg-muted p-4 rounded-md text-sm border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                Relato Original
                {!chamadoAtivo?.permissao_compartilhar && (
                  <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Sigilo Absoluto
                  </span>
                )}
              </h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{chamadoAtivo?.texto}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Adicionar Resposta / Conclusão</h4>
              <Textarea 
                placeholder="Descreva as ações tomadas e a resolução deste caso. Esta mensagem será registrada no histórico."
                className="min-h-[120px] resize-none"
                value={respostaTexto}
                onChange={(e) => setRespostaTexto(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)} disabled={isReplying}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmarResposta} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
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