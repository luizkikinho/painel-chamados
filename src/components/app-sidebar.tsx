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
  const { isMobile } = useSidebar()

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
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {activeUser.role === "master" && (
          <NavProjects projects={data.adminMenu} />
        )}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      {!isMobile && (
        <SidebarFooter>
          <NavUser user={activeUser} />
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
