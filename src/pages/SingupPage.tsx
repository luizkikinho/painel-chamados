import { Lock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useNavigate } from "react-router"
import { useState } from "react"

export default function AlterarSenha() {
  const navigate = useNavigate()
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [loading, setLoading] = useState(false)

  const handleDefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault()

    if (senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.")
      return
    }
    if (senha !== confirmarSenha) {
      toast.error("As senhas não coincidem.")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({
      password: senha,
    })
    setLoading(false)

    if (error) {
      toast.error(`Erro ao atualizar: ${error.message}`)
      return
    }

    toast.success("Senha cadastrada com sucesso!")
    navigate("/")
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Lock className="size-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Atualizar Senha
          </h1>
          <p className="text-sm text-muted-foreground">
            Digite sua nova senha abaixo para recuperar seu acesso.
          </p>
        </div>

        <form onSubmit={handleDefinirSenha} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Nova Senha</label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Confirmar Senha</label>
            <input
              type="password"
              required
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Atualizar Senha"}
          </button>
        </form>
      </div>
    </div>
  )
}
