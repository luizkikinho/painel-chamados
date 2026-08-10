import { UserContext } from "@/lib/user-context"
import { useContext } from "react"
import { Navigate } from "react-router"

export function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const context = useContext(UserContext)
  if (!context) return null

  const { userProfile } = context
  if (!userProfile) return null

  if (userProfile.cargo !== "super_admin") {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
