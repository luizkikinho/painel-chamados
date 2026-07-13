import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Ticket,
  HomeIcon,
  CircleQuestionMarkIcon,
  Settings2,
  UsersIcon,
  MessageSquareIcon,
  BuildingIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

type UserProfile = {
  name: string
  email: string
  cargo: string
} | null

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userProfile: UserProfile
}

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: <HomeIcon />,
    },
    {
      title: "Chamados",
      url: "",
      icon: <Ticket />,
      isActive: true,
      items: [
        { title: "Todos os Chamados", url: "/chamados" },
        { title: "Meus Chamados", url: "/chamados/meus" },
        { title: "Em Aberto", url: "/chamados/abertos" },
        { title: "Finalizados", url: "/chamados/finalizados" },
      ],
    },
    {
      title: "FAQ",
      url: "/faq",
      icon: <CircleQuestionMarkIcon />,
    },
  ],

  navSecondary: [
    {
      title: "Configurações",
      url: "/config",
      icon: <Settings2 />,
    },
  ],

  adminMenu: [
    {
      name: "Usuários",
      url: "",
      icon: <UsersIcon />,
      items: [
        { name: "Lista de Usuários", url: "/admin/usuarios" },
        { name: "Novo Usuário", url: "/admin/usuarios/novo" },
      ],
    },
    {
      name: "WhatsApp Bot",
      url: "/admin/whatsapp",
      icon: <MessageSquareIcon />,
    },
    {
      name: "Empresa",
      url: "/admin/empresa",
      icon: <BuildingIcon />,
    },
  ],
}

export function AppSidebar({ userProfile, ...props }: AppSidebarProps) {
  const { toggleSidebar, state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const [activeUser, setActiveUser] = React.useState({
    name: userProfile?.name || "Carregando...",
    email: userProfile?.email || "",
    avatar: "",
    role: userProfile?.cargo || "funcionario",
  })

  React.useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: adminData, error } = await supabase
          .from("administradores_api")
          .select("nome, cargo")
          .eq("id", user.id)
          .single()

        if (error) {
          toast.error("Houve um erro ao buscar dados do administrador")
          console.error(error.message)
        }

        setActiveUser({
          name: adminData?.nome || "Usuário",
          email: user.email || "",
          avatar: "",
          role: adminData?.cargo || "funcionario",
        })
      }
    }

    getUser()
  }, [])

  return (
    <Sidebar
      collapsible="icon"
      className="group/sidebar relative !h-full !border-none"
      {...props}
    >
      {/* Botão flutuante reposicionado para top-2 para acompanhar os ícones */}
      <div className="absolute top-2 -right-5 z-[100] hidden h-10 w-12 items-center justify-end opacity-0 transition-opacity duration-300 group-hover/sidebar:opacity-100 md:flex">
        <button
          onClick={toggleSidebar}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-border/50 bg-background text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* A CAUSA DO ESPAÇO: Reduzido de pt-6 para pt-2 */}
      <SidebarContent className="pt-2 group-data-[state=collapsed]:items-center group-data-[state=collapsed]:px-0">
        <NavMain items={data.navMain} />
        {activeUser.role === "master" && (
          <NavProjects projects={data.adminMenu} />
        )}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter className="group-data-[state=collapsed]:items-center group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:pb-4">
        <NavUser user={activeUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
