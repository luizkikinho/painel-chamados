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
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-sidebar">
      {/* HEADER IMUTÁVEL NO TOPO */}
      <SiteHeader userProfile={userProfile} />
      <div className="flex flex-1 overflow-hidden">
        {/* A MÁGICA: !min-h-0 impede a Sidebar de transbordar pelo fundo da tela */}
        <SidebarProvider className="flex h-full !min-h-0 w-full">
          <AppSidebar userProfile={userProfile} />

          <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-transparent">
            <main className="flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-border/50 bg-background shadow-md">
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <Outlet />
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  )
}
