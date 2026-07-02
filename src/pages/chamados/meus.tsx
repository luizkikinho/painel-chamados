import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

import { ChamadoCard } from "@/components/chamado-card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ChamadoFormatado {
  id: string
  protocol: string
  horasAberto: number
  texto: string
  status: string
  isOwner: boolean
}

export default function Chamados() {
  const [chamados, setChamados] = useState<ChamadoFormatado[]>([])
  const [loading, setLoading] = useState(true)

  // Estados para o fluxo de resposta
  const [chamadoSelecionado, setChamadoSelecionado] =
    useState<ChamadoFormatado | null>(null)
  const [textoResposta, setTextoResposta] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchChamados = async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      console.error("Usuário não encontrado")
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("chamados_painel")
      .select("*")
      .eq("agente_responsavel_id", authData.user.id)
      .neq("status", "concluido")
      .order("data", { ascending: true })

    if (error) {
      console.error("Erro ao buscar chamados:", error)
    } else {
      const chamadosSLA =
        data?.map((chamado) => {
          const msAberto =
            new Date().getTime() - new Date(chamado.data).getTime()
          const horas = Math.floor(msAberto / (1000 * 60 * 60))

          return {
            id: chamado.id,
            protocol: chamado.protocol,
            texto: chamado.texto,
            horasAberto: horas > 0 ? horas : 0,
            status: chamado.status,
            isOwner: true, // Já vem filtrado pelo seu ID
          }
        }) || []

      setChamados(chamadosSLA)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchChamados()
  }, [])

  const handleAbrirDialog = (chamado: ChamadoFormatado) => {
    setChamadoSelecionado(chamado)
    setTextoResposta("")
    setIsDialogOpen(true)
  }

  const handleConfirmarEnvio = async () => {
    if (!chamadoSelecionado || !textoResposta.trim()) return

    setIsSubmitting(true)
    const { data: authData } = await supabase.auth.getUser()

    if (!authData.user) {
      console.error("Usuário não autenticado")
      setIsSubmitting(false)
      return
    }

    // 1. Insere a resposta no registro_chamados
    const { error: registroError } = await supabase
      .from("registro_chamados")
      .insert({
        id_chamado: chamadoSelecionado.id,
        texto: textoResposta,
        tipo_acao: "resposta",
        usuario_chamado: authData.user.id,
      })

    if (registroError) {
      console.error("Erro ao salvar registro da resposta:", registroError)
      setIsSubmitting(false)
      return
    }

    // 2. Atualiza o status do chamado principal para concluído
    const { error: updateError } = await supabase
      .from("chamados")
      .update({ status: "concluido" })
      .eq("id", chamadoSelecionado.id)

    if (updateError) {
      console.error("Erro ao atualizar status do chamado:", updateError)
      setIsSubmitting(false)
      return
    }

    // Limpa os estados e recarrega a lista
    setIsSubmitting(false)
    setIsAlertOpen(false)
    setIsDialogOpen(false)
    setChamadoSelecionado(null)
    setLoading(true)
    fetchChamados()
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meus Chamados</h1>
        <p className="text-muted-foreground">
          Listagem de tickets atribuídos a mim.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando chamados...</p>
      ) : chamados.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum chamado pendente no momento.
        </p>
      ) : (
        <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {chamados.map((chamado) => (
            <ChamadoCard
              key={chamado.id}
              id={chamado.protocol || chamado.id.substring(0, 8)}
              horasAberto={chamado.horasAberto}
              texto={chamado.texto}
              status={chamado.status}
              isOwner={chamado.isOwner}
              onResponder={() => handleAbrirDialog(chamado)}
            />
          ))}
        </div>
      )}

      {/* Dialog Principal de Resposta */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Responder Chamado {chamadoSelecionado?.protocol}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
              {chamadoSelecionado?.texto}
            </div>

            <Textarea
              placeholder="Digite a resposta do chamado..."
              className="min-h-[150px]"
              value={textoResposta}
              onChange={(e) => setTextoResposta(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!textoResposta.trim() || isSubmitting}
              onClick={() => setIsAlertOpen(true)}
            >
              Responder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para Confirmação de Ação Irreversível */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O chamado será marcado como concluído e
              a resposta será registrada de forma permanente no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmarEnvio()
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Confirmar e Concluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
