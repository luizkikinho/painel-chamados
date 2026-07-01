import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { TicketIcon } from "lucide-react"

interface ChamadoCardProps {
  id: string
  horasAberto: number
  texto: string
  status: string
  isOwner: boolean
  onAtender: (id: string) => void
  onResponder: (id: string) => void
}

export function ChamadoCard({
  id,
  horasAberto,
  texto,
  status,
  isOwner,
  onAtender,
  onResponder,
}: ChamadoCardProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary"
  let corClasses = "bg-green-500/10 text-green-500 hover:bg-green-500/20"
  let urgenciaTexto = "Baixa"

  if (horasAberto >= 48) {
    variant = "destructive"
    corClasses = ""
    urgenciaTexto = "Crítica"
  } else if (horasAberto >= 24) {
    variant = "secondary"
    corClasses = "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"
    urgenciaTexto = "Alta"
  } else if (horasAberto >= 4) {
    variant = "secondary"
    corClasses = "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
    urgenciaTexto = "Média"
  }

  return (
    <Card className="flex flex-col transition-colors hover:bg-muted/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Badge variant={variant} className={corClasses}>
          {urgenciaTexto} Urgência
        </Badge>

        <span className="text-xs text-muted-foreground">
          {horasAberto}h atrás
        </span>
      </CardHeader>

      <CardContent>
        <CardTitle className="line-clamp-2 text-base leading-snug">
          {texto}
        </CardTitle>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
          <TicketIcon className="size-4" />#{id}
        </div>

        {/* Renderização condicional dos botões */}
        {status === "aberto" && (
          <Button
            size="sm"
            className="font-semibold"
            onClick={() => onAtender(id)}
          >
            Atender
          </Button>
        )}

        {status === "em_andamento" && isOwner && (
          <Button
            size="sm"
            variant="outline"
            className="bg-white font-semibold"
            onClick={() => onResponder(id)}
          >
            Responder
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
