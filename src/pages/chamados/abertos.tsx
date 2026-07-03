import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

import { ChamadoCard } from "@/components/chamado-card"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router"

interface ChamadoFormatado {
  id: string
  protocol: string
  horasAberto: number
  texto: string
  status: string
  isOwner: boolean
}

export default function Chamados() {
  const navigate = useNavigate()
  const [chamados, setChamados] = useState<ChamadoFormatado[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChamados = async () => {
    const { data, error } = await supabase
      .from("chamados_painel")
      .select("*")
      .is("agente_responsavel_id", null)
      .order("data", { ascending: true })

    if (error) {
      toast.error("Houve um erro ao tentar buscar chamados abertos")
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
            isOwner: false,
          }
        }) || []

      setChamados(chamadosSLA)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchChamados()
  }, [])

  const handleAtender = async (id: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return console.error("Usuário não autenticado")

    const { error } = await supabase
      .from("chamados")
      .update({ agente_responsavel_id: user.id, status: "em_andamento" })
      .eq("id", id)

    if (error) {
      toast.error("Houve um erro ao assumir o chamado")
      console.error(error)
    } else {
      toast.success("Chamado atribuido a você", {
        action: (
          <Button onClick={() => navigate("/chamados/meus")}>
            Meus chamados
          </Button>
        ),
      })
      setLoading(true)
      fetchChamados()
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Todos os Chamados</h1>
        <p className="text-muted-foreground">
          Listagem de tickets aguardando atendimento.
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
              id={chamado.protocol || chamado.id.substring(0, 8)} // Exibindo o protocolo ou um pedaço do UUID
              horasAberto={chamado.horasAberto}
              texto={chamado.texto}
              status={chamado.status}
              isOwner={chamado.isOwner}
              onAtender={() => handleAtender(chamado.id)}
              onResponder={() =>
                console.log("Abrir dialog do chamado", chamado.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
