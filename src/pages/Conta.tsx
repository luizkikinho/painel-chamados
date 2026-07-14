import { useContext, useState } from "react"
import { UserContext } from "@/lib/user-context"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Briefcase, Loader2, Save } from "lucide-react"

export default function Conta() {
  const context = useContext(UserContext)

  const [nome, setNome] = useState(context?.userProfile?.name || "")
  const [isLoading, setIsLoading] = useState(false)

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nome.trim()) {
      toast.error("O nome é obrigatório.")
      return
    }

    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não encontrado")

      // Atualiza apenas o nome no banco de dados
      const { error } = await supabase
        .from("administradores")
        .update({ nome })
        .eq("id", user.id)

      if (error) throw error

      if (context?.setUserProfile && context?.userProfile) {
        context.setUserProfile({
          ...context.userProfile,
          name: nome,
        })
      }

      toast.success("Perfil atualizado com sucesso!")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao salvar as alterações. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!context?.userProfile) return null

  return (
    <div className="mx-auto max-w-2xl animate-in space-y-8 duration-500 fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Minha Conta</h2>
        <p className="mt-2 text-muted-foreground">
          Gerencie suas informações pessoais e credenciais de acesso.
        </p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 border-b p-6">
          <h3 className="leading-none font-semibold tracking-tight">
            Perfil Público
          </h3>
          <p className="text-sm text-muted-foreground">
            Estes dados são visíveis no sistema.
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSalvar} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  Nome Completo
                </Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo" className="flex items-center gap-2">
                  <Briefcase className="size-4 text-muted-foreground" />
                  Cargo / Função
                </Label>
                <Input
                  id="cargo"
                  value={context.userProfile.cargo}
                  disabled
                  className="cursor-not-allowed bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  Apenas administradores master podem alterar o cargo.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                E-mail de Acesso
              </Label>
              <Input
                id="email"
                type="email"
                value={context.userProfile.email}
                disabled
                className="cursor-not-allowed bg-muted/50"
              />
            </div>

            <div className="flex justify-end border-t pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full gap-2 sm:w-auto"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {isLoading ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
