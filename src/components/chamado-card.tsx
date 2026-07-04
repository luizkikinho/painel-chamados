import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { TicketIcon, CornerDownRight, Lock } from "lucide-react"

interface ChamadoCardProps {
  id: string
  horasAberto: number
  texto: string
  status: string
  isOwner: boolean
  resposta?: string
  onAtender?: (id: string) => void
  onResponder: (id: string) => void
}

export function ChamadoCard({
  id,
  horasAberto,
  texto,
  status,
  isOwner,
  resposta,
  onAtender,
  onResponder,
}: ChamadoCardProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary"
  let corClasses = "bg-green-500/10 text-green-500 hover:bg-green-500/20"
  let badgeTexto = "Aberto"

  if (status === "aberto") {
    variant = "outline"
    corClasses = ""
    badgeTexto = "Aberto"
  } else if (status === "em_andamento") {
    variant = "outline"
    corClasses = "bg-yellow-500/8 text-orange-300 hover:bg-yellow-500/20"
    badgeTexto = "A responder"
  }

  const isConfidential = texto === "*** CONTEÚDO EM SIGILO ABSOLUTO ***"

  return (
    <Card className="flex flex-col transition-colors hover:bg-muted/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Badge
          variant={status === "concluido" ? "outline" : variant}
          className={
            status === "concluido"
              ? "bg-muted text-muted-foreground"
              : corClasses
          }
        >
          {status === "concluido" ? "Concluído" : `${badgeTexto}`}
        </Badge>

        {status !== "concluido" && (
          <span className="text-xs text-muted-foreground">
            {horasAberto}h atrás
          </span>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <CardTitle
          className={`line-clamp-2 text-base leading-snug ${
            isConfidential
              ? "flex items-center gap-2 text-sm font-normal text-muted-foreground italic"
              : ""
          }`}
        >
          {isConfidential ? (
            <>
              <Lock className="size-4 shrink-0" />
              Conteúdo protegido
            </>
          ) : (
            texto
          )}
        </CardTitle>

        {status === "concluido" && resposta && (
          <div className="mt-2 flex gap-2 rounded-sm bg-muted/70 p-2.5 text-xs text-muted-foreground">
            <CornerDownRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">
                Sua resposta:
              </span>
              <p className="line-clamp-3">{resposta}</p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
          <TicketIcon className="size-4" />#{id}
        </div>

        {status === "aberto" && onAtender && (
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
