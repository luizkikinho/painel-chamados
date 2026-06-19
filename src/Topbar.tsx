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
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

// NOVO: Adicionamos a tipagem para aceitar os 'children'
interface TopbarProps {
  children?: React.ReactNode
}

export function Topbar({ children }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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
    await supabase.auth.signOut()
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsSaving(false)
      return
    }

    await supabase.from('administradores').update({ nome, telefone }).eq('id', user.id)

    if (novaSenha && novaSenha === confirmarSenha) {
      await supabase.auth.updateUser({ password: novaSenha })
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
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }

  return (
    <>
      <header className="flex h-[72px] md:h-16 w-full items-center justify-between border-b bg-background px-4 md:px-6 gap-4">
        {/* Lado Esquerdo: Logo */}
        <div className="flex items-center md:w-[280px] shrink-0">
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
            Denúncias<span className="text-blue-600">Admin</span>
          </h1>
        </div>

        {/* Centro: Onde as Abas (Tabs) serão injetadas */}
        <div className="flex-1 flex justify-center w-full max-w-[650px] overflow-x-auto hide-scrollbar">
          {children}
        </div>

        {/* Lado Direito: Ações */}
        <div className="flex items-center justify-end gap-2 md:gap-4 md:w-[280px] shrink-0">
          <div className="hidden xl:block">
            <Input
              type="search"
              placeholder="Buscar ticket ou hash..."
              className="w-56"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-full"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Alternar tema</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full bg-muted">
                <Avatar className="h-9 w-9 md:h-10 md:w-10">
                  <AvatarFallback className="font-semibold text-xs md:text-sm">
                    {getInitials(nome)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>Perfil</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>Configurações</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsLogoutAlertOpen(true)} className="text-red-600 focus:bg-red-50 focus:text-red-600">
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Modais omitidos para brevidade (mantenha os mesmos do seu código original) */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Meu Perfil</DialogTitle>
            <DialogDescription>Atualize suas informações pessoais.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>E-mail de Acesso</Label><Input value={emailUser} disabled className="bg-muted/50" /></div>
            <div className="space-y-2"><Label>Nome Completo</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
            <div className="space-y-2"><Label>Telefone (Opcional)</Label><Input value={telefone} onChange={(e) => setTelefone(e.target.value)} /></div>
            <div className="space-y-2 pt-2">
              <Label className="text-sm font-semibold text-muted-foreground">Alterar Senha</Label>
              <div className="grid gap-3">
                <Input type="password" placeholder="Senha atual" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
                <Input type="password" placeholder="Nova senha" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
                <Input type="password" placeholder="Confirmar nova senha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSaveProfile} className="bg-blue-600 text-white hover:bg-blue-700" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Configurações do Sistema</DialogTitle></DialogHeader>
          <div className="py-4"><p className="text-sm text-muted-foreground">Opções em construção...</p></div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja sair?</AlertDialogTitle>
            <AlertDialogDescription>Sua sessão será encerrada.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-600 text-white hover:bg-red-700">Sim, quero sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}