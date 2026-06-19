import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function Topbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Estados do formulário de Perfil
  const [emailUser, setEmailUser] = useState("")
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email) {
        setEmailUser(user.email)
        
        // Busca os dados complementares na tabela administradores
        const { data: adminData } = await supabase
          .from('administradores')
          .select('nome, telefone')
          .eq('id', user.id)
          .single()

        if (adminData) {
          if (adminData.nome) setNome(adminData.nome)
          if (adminData.telefone) setTelefone(adminData.telefone)
        }
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error("Erro ao sair:", error.message)
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setIsSaving(false)
      return
    }

    // 1. Atualiza Nome e Telefone na tabela administradores
    const { error: dbError } = await supabase
      .from('administradores')
      .update({ nome, telefone })
      .eq('id', user.id)

    if (dbError) {
      console.error("Erro ao atualizar perfil no banco:", dbError.message)
      setIsSaving(false)
      return
    }

    // 2. Atualiza a senha no Auth se os campos foram preenchidos corretamente
    if (novaSenha && novaSenha === confirmarSenha) {
      const { error: authError } = await supabase.auth.updateUser({
        password: novaSenha
      })
      if (authError) {
        console.error("Erro ao atualizar senha:", authError.message)
      }
    }

    setIsSaving(false)
    setIsProfileOpen(false)
    setSenhaAtual("")
    setNovaSenha("")
    setConfirmarSenha("")
  }

  const getInitials = (fullName: string): string => {
    if (!fullName) return "AD" 
    const words = fullName.trim().split(/\s+/)
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
    
    const firstLetter = words[0][0]
    const lastLetter = words[words.length - 1][0]
    return (firstLetter + lastLetter).toUpperCase()
  }

  return (
    <>
      <header className="flex h-16 w-full items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Denúncias<span className="text-blue-600">Admin</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:block">
            <Input
              type="search"
              placeholder="Buscar ticket ou hash..."
              className="w-64"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-muted">
                <Avatar>
                  <AvatarFallback className="font-semibold">
                    {getInitials(nome)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setIsLogoutAlertOpen(true)} 
                className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
              >
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Modal de Perfil */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Meu Perfil</DialogTitle>
            <DialogDescription>
              Atualize suas informações pessoais e credenciais de acesso.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail de Acesso</Label>
              <Input id="email" value={emailUser} disabled className="bg-muted/50" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input 
                id="nome" 
                placeholder="Seu nome" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (Opcional)</Label>
              <Input 
                id="telefone" 
                placeholder="(00) 00000-0000" 
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-sm font-semibold text-muted-foreground">Alterar Senha</Label>
              <div className="grid gap-3">
                <Input 
                  type="password" 
                  placeholder="Senha atual" 
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                />
                <Input 
                  type="password" 
                  placeholder="Nova senha" 
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                />
                <Input 
                  type="password" 
                  placeholder="Confirmar nova senha" 
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveProfile} 
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Configurações */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações do Sistema</DialogTitle>
            <DialogDescription>
              Ajuste as preferências globais da sua instância.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">Opções em construção...</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alerta de Confirmação de Saída */}
      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja sair?</AlertDialogTitle>
            <AlertDialogDescription>
              Sua sessão atual será encerrada e você precisará fazer login novamente para acessar o painel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-600 text-white hover:bg-red-700">
              Sim, quero sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}