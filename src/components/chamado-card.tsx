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

// Definimos o que o card precisa receber
interface ChamadoCardProps {
  id: string
  urgencia: string
  tempo: string
  texto: string
  onAtender: () => void // Função que será chamada ao clicar no botão
}

export function ChamadoCard({
  id,
  urgencia,
  tempo,
  texto,
  onAtender,
}: ChamadoCardProps) {
  // Lógica simples para mudar a cor da tag dependendo da urgência
  const isAltaUrgencia = urgencia.toLowerCase() === "alta"

  return (
    <Card className="flex flex-col transition-colors hover:bg-muted/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Badge
          variant={isAltaUrgencia ? "destructive" : "secondary"}
          className={
            !isAltaUrgencia
              ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
              : ""
          }
        >
          {urgencia} Urgência
        </Badge>

        <span className="text-xs text-muted-foreground">{tempo}</span>
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

        <Button size="sm" className="font-semibold" onClick={onAtender}>
          Atender
        </Button>
      </CardFooter>
    </Card>
  )
}
