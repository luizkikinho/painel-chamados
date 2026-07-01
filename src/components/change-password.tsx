import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ChangePasswordDialog() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleResetPassword = async () => {
    setIsLoading(true)
    setMessage("")
    
    // Dispara o e-mail de recuperação direcionando de volta para a sua aplicação local
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/', 
    })

    setIsLoading(false)

    if (error) {
      setMessage("Erro ao enviar e-mail: " + error.message)
    } else {
      setMessage("Link de recuperação enviado com sucesso! Verifique sua caixa de entrada.")
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" type="button" className="w-full">
          Esqueceu a Senha?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recuperar Senha</DialogTitle>
          <DialogDescription>
            Digite o seu e-mail corporativo abaixo. Enviaremos um link para você redefinir sua senha.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reset-email">E-mail</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="email@dominio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {message && (
            <p className="text-sm font-medium text-center text-primary">
              {message}
            </p>
          )}
        </div>
        <DialogFooter className="sm:justify-start">
          <Button 
            type="button" 
            onClick={handleResetPassword} 
            disabled={isLoading || !email}
          >
            {isLoading ? "Enviando..." : "Enviar link"}
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="ghost">Cancelar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}