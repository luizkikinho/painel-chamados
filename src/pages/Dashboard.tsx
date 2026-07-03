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
      <SidebarProvider className="flex h-screen overflow-hidden">
        <AppSidebar userProfile={userProfile} />
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          <SiteHeader userProfile={userProfile} />
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
