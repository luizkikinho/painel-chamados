import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Outlet } from "react-router"

type UserProfile = {
  name: string
  email: string
  cargo: string
} | null

export default function Dashboard({
  userProfile,
}: {
  userProfile: UserProfile
}) {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar userProfile={userProfile} />
          <SidebarInset>
            {/* 2. Removemos os Skeletons fixos e colocamos o Outlet */}
            {/* Tudo que for página vai ser renderizado automaticamente aqui dentro */}
            <div className="flex flex-1 flex-col gap-4 p-4">
              <Outlet />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
