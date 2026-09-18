import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, MessageSquare, RotateCcw, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  GRUPOS_MENSAGENS_BOT,
  type MensagemBotPadrao,
} from "@/lib/mensagensBot"

interface Sobrescrita {
  id: string
  texto: string
}

export default function MensagensBot({
  empresaId,
}: {
  empresaId: string | null
}) {
  const [sobrescritas, setSobrescritas] = useState<
    Record<string, Sobrescrita>
  >({})
  const [rascunhos, setRascunhos] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    const select = supabase
      .from("mensagens_bot")
      .select("id, chave, texto")
    const query = empresaId
      ? select.eq("empresa_id", empresaId)
      : select.limit(0)
    query.then(({ data, error }) => {
      if (!ativo) return
      if (error) {
        setSobrescritas({})
        setRascunhos({})
        toast.error(
          "Não foi possível carregar as mensagens: " + error.message
        )
        return
      }
      const mapa: Record<string, Sobrescrita> = {}
      const rasc: Record<string, string> = {}
      for (const r of data ?? []) {
        mapa[r.chave] = { id: r.id, texto: r.texto }
        rasc[r.chave] = r.texto
      }
      setSobrescritas(mapa)
      setRascunhos(rasc)
    })
    return () => {
      ativo = false
    }
  }, [empresaId])

  const handleSalvar = async (item: MensagemBotPadrao) => {
    const texto = (rascunhos[item.chave] ?? "").trim()
    const atual = sobrescritas[item.chave]

    setSalvando(item.chave)
    try {
      if (!texto) {
        if (!atual) return
        const { error } = await supabase
          .from("mensagens_bot")
          .delete()
          .eq("id", atual.id)
        if (error) throw new Error(error.message)
        setSobrescritas((prev) => {
          const copia = { ...prev }
          delete copia[item.chave]
          return copia
        })
        setRascunhos((prev) => ({ ...prev, [item.chave]: "" }))
        toast.success("Mensagem restaurada ao padrão.")
        return
      }

      if (atual) {
        const { error } = await supabase
          .from("mensagens_bot")
          .update({ texto })
          .eq("id", atual.id)
        if (error) throw new Error(error.message)
        setSobrescritas((prev) => ({
          ...prev,
          [item.chave]: { ...atual, texto },
        }))
      } else {
        const { data, error } = await supabase
          .from("mensagens_bot")
          .insert({ empresa_id: empresaId, chave: item.chave, texto })
          .select("id")
          .single()
        if (error) throw new Error(error.message)
        setSobrescritas((prev) => ({
          ...prev,
          [item.chave]: { id: data.id, texto },
        }))
      }
      toast.success("Mensagem salva.")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar mensagem.")
    } finally {
      setSalvando(null)
    }
  }

  const status = (chave: string) => {
    const sob = sobrescritas[chave]
    const rasc = rascunhos[chave] ?? ""
    if (!sob) return <Badge variant="outline">Padrão</Badge>
    if (rasc.trim() !== sob.texto.trim())
      return <Badge variant="secondary">Alterado</Badge>
    return <Badge>Personalizada</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <CardTitle>Mensagens do Bot</CardTitle>
        </div>
        <CardDescription>
          Voz do assistente. Cada mensagem pode ser personalizada para a
          empresa; deixe o campo vazio para usar o texto padrão.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!empresaId ? (
          <p className="text-sm text-muted-foreground">
            Selecione uma empresa para editar as mensagens.
          </p>
        ) : (
          GRUPOS_MENSAGENS_BOT.map((grupo) => (
            <div key={grupo.titulo} className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">{grupo.titulo}</h3>
                {grupo.descricao && (
                  <p className="text-xs text-muted-foreground">
                    {grupo.descricao}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                {grupo.itens.map((item) => {
                  return (
                    <div
                      key={item.chave}
                      className="space-y-2 rounded-md border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {item.rotulo}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {item.chave}
                          </div>
                        </div>
                        {status(item.chave)}
                      </div>
                      <Textarea
                        value={rascunhos[item.chave] ?? ""}
                        onChange={(e) =>
                          setRascunhos((prev) => ({
                            ...prev,
                            [item.chave]: e.target.value,
                          }))
                        }
                        placeholder={item.padrao}
                        rows={item.padrao.length > 140 ? 5 : 3}
                      />
                      {item.dica && (
                        <p className="text-xs text-muted-foreground">
                          {item.dica}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {(rascunhos[item.chave] ?? "").length} caracteres
                        </span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setRascunhos((prev) => ({
                                ...prev,
                                [item.chave]: item.padrao,
                              }))
                            }
                          >
                            <RotateCcw className="mr-1 h-3.5 w-3.5" />
                            Usar padrão
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={salvando === item.chave}
                            onClick={() => handleSalvar(item)}
                          >
                            {salvando === item.chave ? (
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="mr-1 h-3.5 w-3.5" />
                            )}
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}