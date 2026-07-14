import { createContext } from "react"

export interface UserProfile {
  name: string
  email: string
  cargo: string
}

interface UserContextType {
  userProfile: UserProfile | null
  setUserProfile: (profile: UserProfile | null) => void
}

export const UserContext = createContext<UserContextType | undefined>(undefined)
