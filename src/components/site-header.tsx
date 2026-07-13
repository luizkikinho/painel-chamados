import { useState } from "react"
import { useNavigate } from "react-router"
import {
  Lock,
  User,
  Menu,
  HomeIcon,
  CircleQuestionMarkIcon,
  Settings2,
  UsersIcon,
  MessageSquareIcon,
  BuildingIcon,
  UserCircle2Icon,
  LogOutIcon,
} from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type UserProfile = {
  name: string
  email: string
  cargo: string
} | null

interface SiteHeaderProps {
  userProfile?: UserProfile
}

export function SiteHeader({ userProfile }: SiteHeaderProps) {
  const navigate = useNavigate()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleNav = (path: string) => {
    navigate(path)
    setIsMenuOpen(false)
    setIsProfileOpen(false)
  }

  const isAdmin = userProfile?.cargo === "master"

  const empresaLogo = null
  const empresaNome = "ChamadosAdmin"

  const getInitials = (name?: string) => {
    if (!name) return "US"
    const words = name.trim().split(" ")
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <header className="relative flex h-12 shrink-0 items-center justify-between px-4 md:px-6">
      <a href="/" className="pointer-events-auto flex items-center gap-2">
        {empresaLogo ? (
          <img
            src={empresaLogo}
            alt={empresaNome}
            className="h-2 w-auto object-contain"
          />
        ) : (
          <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Lock className="size-4" />
            </div>
            <div className="hidden text-left text-sm leading-tight sm:grid">
              <span className="truncate font-semibold tracking-tight text-sidebar-foreground">
                {empresaNome}
              </span>
            </div>
          </>
        )}
      </a>

      {/* 1. Lado Esquerdo: Menu Mobile Completo */}
      <div className="z-10 flex items-center gap-2">
        <div className="md:hidden">
          <Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 gap-2 px-3 text-sidebar-foreground"
              >
                <Menu className="h-5 w-5" />
                Menu
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader className="border-b border-border/40 pb-4 text-left">
                <DrawerTitle>Menu Principal</DrawerTitle>
              </DrawerHeader>

              <div className="flex max-h-[75vh] flex-col gap-6 overflow-y-auto p-4 pb-8">
                {/* Categoria: Visão Geral */}
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleNav("/")}
                  >
                    <HomeIcon className="mr-2 h-4 w-4" /> Dashboard
                  </Button>
                </div>

                {/* Categoria: Chamados */}
                <div className="flex flex-col gap-1">
                  <h4 className="mb-2 px-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Chamados
                  </h4>
                  <Button
                    variant="ghost"
                    className="w-full justify-start pl-8"
                    onClick={() => handleNav("/chamados")}
                  >
                    Todos os Chamados
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start pl-8"
                    onClick={() => handleNav("/chamados/meus")}
                  >
                    Meus Chamados
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start pl-8"
                    onClick={() => handleNav("/chamados/abertos")}
                  >
                    Em Aberto
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start pl-8"
                    onClick={() => handleNav("/chamados/finalizados")}
                  >
                    Finalizados
                  </Button>
                </div>

                {/* Categoria: Sistema */}
                <div className="flex flex-col gap-1">
                  <h4 className="mb-2 px-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Sistema
                  </h4>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleNav("/faq")}
                  >
                    <CircleQuestionMarkIcon className="mr-2 h-4 w-4" /> FAQ
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleNav("/config")}
                  >
                    <Settings2 className="mr-2 h-4 w-4" /> Configurações
                  </Button>
                </div>

                {/* Categoria: Administração (Exclusivo Master) */}
                {isAdmin && (
                  <div className="flex flex-col gap-1">
                    <h4 className="mb-2 px-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Menu Administrativo
                    </h4>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleNav("/admin/usuarios")}
                    >
                      <UsersIcon className="mr-2 h-4 w-4" /> Usuários
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleNav("/admin/whatsapp")}
                    >
                      <MessageSquareIcon className="mr-2 h-4 w-4" /> WhatsApp
                      Bot
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleNav("/admin/empresa")}
                    >
                      <BuildingIcon className="mr-2 h-4 w-4" /> Empresa
                    </Button>
                  </div>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* 2. Centro: Identidade Visual */}

      {/* 3. Lado Direito: Perfil (Mobile) com Ícones */}
      <div className="z-10 flex items-center justify-end gap-2">
        <div className="flex items-center md:hidden">
          <Drawer open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <div>{getInitials(userProfile?.name)}</div>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader className="border-b border-border/40 pb-4 text-left">
                <DrawerTitle>Meu Perfil</DrawerTitle>
              </DrawerHeader>

              {/* Informações do Usuário */}
              <div className="p-4 pb-2">
                <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/20 p-3 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm leading-tight font-semibold">
                      {userProfile?.name || "Usuário"}
                    </span>
                    <span className="mt-0.5 truncate text-xs text-muted-foreground">
                      {userProfile?.email || "Sem e-mail"}
                    </span>
                    {userProfile?.cargo && (
                      <span className="mt-1.5 w-fit rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-primary uppercase">
                        {userProfile.cargo}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col gap-1 p-4 pt-2 pb-8">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={() => handleNav("/config")}
                >
                  <UserCircle2Icon className="mr-3 h-4 w-4" />
                  Configurações da Conta
                </Button>

                <div className="my-2 h-px w-full bg-border/40" />

                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => supabase.auth.signOut()}
                >
                  <LogOutIcon className="mr-3 h-4 w-4" />
                  Sair do Sistema
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </header>
  )
}
