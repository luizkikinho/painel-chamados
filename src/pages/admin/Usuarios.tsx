import { useEffect, useState, useContext } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { UserContext } from "@/lib/user-context"

type Usuario = {
  id: string
  nome: string
  cargo: string
}

export default function UsuariosPage() {
  const context = useContext(UserContext)
  const isMaster = context?.userProfile?.cargo === "master"

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")

  const carregarUsuarios = async () => {
    const { data, error } = await supabase.from("administradores").select("*")
    if (error) {
      toast.error("Erro ao carregar usuários.")
      return
    }
    setUsuarios(data || [])
  }

  useEffect(() => {
    const loadUsuarios = async () => {
      await carregarUsuarios()
    }
    loadUsuarios()
  }, [])

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error) return error.message
    if (typeof error === "string") return error
    return String(error ?? fallback)
  }

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const redirectTo = `${window.location.origin}/definir-senha`
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { nome, email, redirectTo },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      if (data?.link) {
        await navigator.clipboard.writeText(data.link)
        toast.success("Usuário criado! Link de primeiro acesso copiado.")
        setNome("")
        setEmail("")
        carregarUsuarios()
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao criar usuário."))
    } finally {
      setLoading(false)
    }
  }

  const handleRemoverUsuario = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return

    try {
      // Nota: Requer uma Edge Function chamada 'delete-user' criada com os mesmos padrões da 'create-user'
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { id },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast.success("Usuário removido com sucesso!")
      carregarUsuarios()
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao remover usuário."))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Gerenciar Usuários</h1>

      {isMaster && (
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Adicionar Novo Usuário</h2>
          <form
            onSubmit={handleCriarUsuario}
            className="flex flex-wrap items-end gap-4"
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="nome" className="text-sm font-medium">
                Nome
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-64 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Nome do usuário"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-64 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="E-mail"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar e Copiar Link"}
            </button>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/50 bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Nome</th>
              <th className="px-6 py-4 font-medium">Cargo</th>
              {isMaster && (
                <th className="px-6 py-4 text-right font-medium">Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {usuarios.map((user) => (
              <tr
                key={user.id}
                className="border-b border-border/50 last:border-0 hover:bg-muted/20"
              >
                <td className="px-6 py-4">{user.nome}</td>
                <td className="px-6 py-4 capitalize">{user.cargo}</td>
                {isMaster && (
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRemoverUsuario(user.id)}
                      className="font-medium text-red-500 hover:text-red-600 hover:underline"
                    >
                      Remover
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td
                  colSpan={isMaster ? 3 : 2}
                  className="px-6 py-8 text-center text-muted-foreground"
                >
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
