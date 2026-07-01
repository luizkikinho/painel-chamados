import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function ChangePasswordForm({
  className,
  onComplete,
  ...props
}: React.ComponentProps<"div"> & { onComplete: () => void }) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setErrorMsg("As senhas não coincidem.")
      return
    }

    setIsLoading(true)
    setErrorMsg("")

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setIsLoading(false)
      setErrorMsg("Erro ao atualizar: " + error.message)
      return
    }

    // AQUI: Remove a sessão temporária criada pelo link de recuperação
    await supabase.auth.signOut()
    
    setIsLoading(false)
    onComplete()
  }

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Atualizar Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo para recuperar seu acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword}>
            <FieldGroup>
              {errorMsg && (
                <p className="text-sm text-red-500 text-center font-medium">
                  {errorMsg}
                </p>
              )}
              
              <Field>
                <FieldLabel htmlFor="password">Nova Senha</FieldLabel>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              
              <Field>
                <FieldLabel htmlFor="confirm-password">
                  Confirmar Senha
                </FieldLabel>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <FieldDescription>
                  Deve ter pelo menos 6 caracteres.
                </FieldDescription>
              </Field>
              
              <Field className="pt-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Atualizar Senha"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}