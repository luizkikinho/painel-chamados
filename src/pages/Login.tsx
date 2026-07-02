import { Lock } from "lucide-react"

import { LoginForm } from "@/components/login-form"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const attemptLogin = async () => {
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      )

      if (authError) {
        throw authError
      }

      return data
    }

    toast.promise(attemptLogin(), {
      loading: "Verificando credenciais...",
      success: "Login realizado com sucesso!",
      error: (err) => {
        if (err.message.includes("Invalid login credentials")) {
          return "E-mail ou senha incorretos."
        }
        if (err.message.includes("Too many requests")) {
          return "Muitas tentativas. Tente novamente mais tarde."
        }
        return "Erro interno ao tentar fazer login."
      },
    })
  }
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Lock className="size-4" />
            </div>
            ChamadosAdmin
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm onSubmit={handleLogin} />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/src/assets/privacy.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.6]"
        />
      </div>
    </div>
  )
}
