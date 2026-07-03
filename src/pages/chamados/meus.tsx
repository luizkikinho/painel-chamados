import { useEffect, useState, useCallback } from "react"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { useMediaQuery } from "usehooks-ts"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

interface ChamadoFormatado {
  id: string
  protocol: string
  horasAberto: number
  texto: string
  status: string
  isOwner: boolean
  resposta?: string
}

// Interface criada para tipar o retorno do banco e evitar o 'any'
interface ChamadoConcluidoDB {
  id: string
  protocol: string
  texto: string
  data: string
  status: string
  agente_responsavel_id: string
  registro_chamados: { texto: string; tipo_acao: string }[]
}

function RespostaForm({
  chamado,
  textoResposta,
  setTextoResposta,
  isSubmitting,
  onConfirm,
  onCancel,
  className,
}: {
  chamado: ChamadoFormatado | null
  textoResposta: string
  setTextoResposta: (t: string) => void
  isSubmitting: boolean
  onConfirm: () => void
  onCancel: () => void
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
        {chamado?.texto}
      </div>

      <Textarea
        placeholder="Digite a resposta do chamado..."
        className="min-h-[150px]"
        value={textoResposta}
        onChange={(e) => setTextoResposta(e.target.value)}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          disabled={!textoResposta.trim() || isSubmitting}
          onClick={onConfirm}
        >
          Responder
        </Button>
      </div>
    </div>
  )
}

export default function Chamados() {
  const [chamados, setChamados] = useState<ChamadoFormatado[]>([])
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState<"aberto" | "concluido">("aberto")

  const [chamadoSelecionado, setChamadoSelecionado] =
    useState<ChamadoFormatado | null>(null)
  const [textoResposta, setTextoResposta] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const fetchChamados = useCallback(async () => {
    setLoading(true)
    setChamados([])
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      console.error("Usuário não encontrado")
      setLoading(false)
      return
    }

    if (abaAtiva === "aberto") {
      const { data, error } = await supabase
        .from("chamados_painel")
        .select("*")
        .eq("agente_responsavel_id", authData.user.id)
        .neq("status", "concluido")
        .order("data", { ascending: true })

      if (error) {
        toast.error("Houve um erro ao tentar buscar chamados atribuidos a você")
        console.error(error)
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
              isOwner: true,
            }
          }) || []
        setChamados(chamadosSLA)
      }
    } else {
      const { data, error } = await supabase
        .from("chamados")
        .select(
          `
          id, protocol, texto, data, status, agente_responsavel_id,
          registro_chamados(texto, tipo_acao)
        `
        )
        .eq("agente_responsavel_id", authData.user.id)
        .eq("status", "concluido")
        .order("data", { ascending: false })

      if (error) {
        toast.error("Houve um erro ao buscar chamados concluídos")
        console.error(error)
      } else {
        const concluidosFormatados =
          (data as unknown as ChamadoConcluidoDB[])?.map((chamado) => {
            const msAberto =
              new Date().getTime() - new Date(chamado.data).getTime()
            const horas = Math.floor(msAberto / (1000 * 60 * 60))

            return {
              id: chamado.id,
              protocol: chamado.protocol,
              texto: chamado.texto,
              horasAberto: horas > 0 ? horas : 0,
              status: chamado.status,
              isOwner: true,
              resposta: chamado.registro_chamados?.[0]?.texto || "",
            }
          }) || []
        setChamados(concluidosFormatados)
      }
    }
    setLoading(false)
  }, [abaAtiva])

  useEffect(() => {
    let isActive = true

    Promise.resolve().then(() => {
      if (isActive) {
        void fetchChamados()
      }
    })

    return () => {
      isActive = false
    }
  }, [fetchChamados])

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
      toast.error("Usuário não autenticado")
      setIsSubmitting(false)
      return
    }

    const { error: registroError } = await supabase
      .from("registro_chamados")
      .insert({
        id_chamado: chamadoSelecionado.id,
        texto: textoResposta,
        tipo_acao: "RESPOSTA_CONCLUSAO",
        usuario_chamado: authData.user.id,
      })

    if (registroError) {
      console.error(registroError)
      toast.error("Erro ao salvar registro da resposta")
      setIsSubmitting(false)
      return
    }

    const { error: updateError } = await supabase
      .from("chamados")
      .update({ status: "concluido" })
      .eq("id", chamadoSelecionado.id)

    if (updateError) {
      console.error("Erro ao atualizar status do chamado:", updateError)
      setIsSubmitting(false)
      return
    }

    toast.success("Chamado respondido!")
    setIsSubmitting(false)
    setIsAlertOpen(false)
    setIsDialogOpen(false)
    setChamadoSelecionado(null)
    fetchChamados()
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meus Chamados</h1>
          <p className="text-muted-foreground">
            Gerencie e filtre os tickets atribuídos ao seu usuário.
          </p>
        </div>

        {/* Removido o 'any' e definido os tipos literais estritos */}
        <Tabs
          value={abaAtiva}
          onValueChange={(v) => setAbaAtiva(v as "aberto" | "concluido")}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-2 sm:w-[300px]">
            <TabsTrigger value="aberto">Em andamento</TabsTrigger>
            <TabsTrigger value="concluido">Concluídos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando chamados...</p>
      ) : chamados.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum chamado encontrado nesta aba.
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
              resposta={chamado.resposta}
              onResponder={() => handleAbrirDialog(chamado)}
            />
          ))}
        </div>
      )}

      {/* Dialog Principal de Resposta */}
      {isDesktop ? (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                Responder Chamado {chamadoSelecionado?.protocol}
              </DialogTitle>
            </DialogHeader>
            <RespostaForm
              chamado={chamadoSelecionado}
              textoResposta={textoResposta}
              setTextoResposta={setTextoResposta}
              isSubmitting={isSubmitting}
              onConfirm={() => setIsAlertOpen(true)}
              onCancel={() => setIsDialogOpen(false)}
              className="py-4"
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>
                Responder Chamado {chamadoSelecionado?.protocol}
              </DrawerTitle>
              <DrawerDescription>
                Forneça a solução para este ticket.
              </DrawerDescription>
            </DrawerHeader>
            <RespostaForm
              chamado={chamadoSelecionado}
              textoResposta={textoResposta}
              setTextoResposta={setTextoResposta}
              isSubmitting={isSubmitting}
              onConfirm={() => setIsAlertOpen(true)}
              onCancel={() => setIsDialogOpen(false)}
              className="px-4 pb-8"
            />
          </DrawerContent>
        </Drawer>
      )}

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
