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
          .from("administradores")
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
      className="group/sidebar relative !h-full"
      {...props}
    >
      <button
        onClick={toggleSidebar}
        className="absolute top-3 -right-4 z-[100] hidden h-8 w-8 -translate-x-2 cursor-pointer items-center justify-center rounded-full border bg-background text-muted-foreground opacity-0 shadow-sm transition-all duration-300 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 hover:bg-accent hover:text-accent-foreground md:flex"
        title={isCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      <SidebarContent className="pt-2">
        <NavMain items={data.navMain} />
        {activeUser.role === "master" && (
          <NavProjects projects={data.adminMenu} />
        )}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      {/* Remoção da trava do isMobile para garantir que o perfil sempre renderize */}
      <SidebarFooter>
        <NavUser user={activeUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
