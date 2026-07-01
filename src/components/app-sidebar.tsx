import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar"
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
      url: "#",
      icon: <HomeIcon />,
    },
    {
      title: "Chamados",
      url: "#",
      icon: <Ticket />,
      isActive: true,
      items: [
        { title: "Meus Chamados", url: "#" },
        { title: "Em Aberto", url: "#" },
        { title: "Finalizados", url: "#" },
      ],
    },
    {
      title: "FAQ",
      url: "#",
      icon: <CircleQuestionMarkIcon />,
    },
  ],

  navSecondary: [
    {
      title: "Configurações",
      url: "#",
      icon: <Settings2 />,
    },
  ],

  adminMenu: [
    {
      name: "Usuários",
      url: "#",
      icon: <UsersIcon />,
    },
    {
      name: "WhatsApp Bot",
      url: "#",
      icon: <MessageSquareIcon />,
    },
    {
      name: "Empresa",
      url: "#",
      icon: <BuildingIcon />,
    },
  ],
}

export function AppSidebar({ userProfile, ...props }: AppSidebarProps) {
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
          console.error("Erro ao buscar dados do administrador:", error.message)
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
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarContent>
        <NavMain items={data.navMain} />
        {activeUser.role === "master" && (
          <NavProjects projects={data.adminMenu} />
        )}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={activeUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
