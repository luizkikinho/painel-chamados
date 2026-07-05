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
    <div className="flex h-screen flex-col overflow-hidden [--header-height:calc(--spacing(14))]">
      <SiteHeader userProfile={userProfile} />

      <div className="flex flex-1 overflow-hidden">
        {/* Adicionado !min-h-0 para evitar que o provedor passe de 100% da área disponível */}
        <SidebarProvider className="flex h-full !min-h-0 w-full">
          <AppSidebar userProfile={userProfile} />

          <SidebarInset className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <Outlet />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  )
}
