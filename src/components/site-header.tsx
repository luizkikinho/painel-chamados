import { useState } from "react"
import { useNavigate } from "react-router"
import { SearchForm } from "@/components/search-form"
import { Separator } from "@/components/ui/separator"
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

  // Controlam se a gaveta está aberta ou fechada
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // Função que faz o redirecionamento e fecha a gaveta na mesma hora
  const handleNav = (path: string) => {
    navigate(path)
    setIsMenuOpen(false)
    setIsProfileOpen(false)
  }

  const isAdmin = userProfile?.cargo === "master"

  return (
    <header className="sticky top-0 z-50 flex h-[var(--header-height)] w-full items-center justify-between border-b bg-background px-4">
      {/* 1. Lado Esquerdo: Drawer de Menu Principal */}
      <div className="flex items-center gap-2">
        <div className="md:hidden">
          <Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle>Menu Principal</DrawerTitle>
              </DrawerHeader>

              {/* Opções Mapeadas do AppSidebar com Scroll */}
              <div className="flex max-h-[80vh] flex-col gap-1 overflow-y-auto p-4 pb-8">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNav("/")}
                >
                  <HomeIcon className="mr-2 h-4 w-4" /> Dashboard
                </Button>

                <div className="py-2">
                  <p className="mb-1 px-4 text-xs font-medium text-muted-foreground">
                    Chamados
                  </p>
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

                {/* Renderiza o menu Admin apenas se for Master */}
                {isAdmin && (
                  <div className="py-2">
                    <p className="mb-1 px-4 text-xs font-medium text-muted-foreground">
                      Menu Administrativo
                    </p>
                    <Button
                      variant="ghost"
                      className="w-full justify-start pl-8"
                      onClick={() => handleNav("/admin/usuarios")}
                    >
                      <UsersIcon className="mr-2 h-4 w-4" /> Usuários
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start pl-8"
                      onClick={() => handleNav("/admin/whatsapp")}
                    >
                      <MessageSquareIcon className="mr-2 h-4 w-4" /> WhatsApp
                      Bot
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start pl-8"
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

        <Separator orientation="vertical" className="mr-2 h-4 md:hidden" />

        <a href="#" className="flex items-center gap-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Lock className="size-4" />
          </div>
          <div className="flex-1 text-left text-sm leading-tight sm:grid">
            <span className="truncate font-medium">ChamadosAdmin</span>
          </div>
        </a>
      </div>

      {/* 2. Centro: Barra de Busca */}
      <div className="flex flex-1 items-center justify-end gap-2 px-2 sm:px-4">
        <SearchForm className="hidden w-full sm:flex sm:w-auto" />
      </div>

      {/* 3. Lado Direito: Drawer de Perfil */}
      <div className="flex items-center md:hidden">
        <Drawer open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              <User className="h-4 w-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Meu Perfil</DrawerTitle>
            </DrawerHeader>

            <div className="flex flex-col gap-4 p-4 pb-8">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleNav("/config")}
              >
                Configurações da Conta
              </Button>
              <Button
                variant="destructive"
                className="justify-start"
                onClick={() => supabase.auth.signOut()}
              >
                Sair do Sistema
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  )
}
