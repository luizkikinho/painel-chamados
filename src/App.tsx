import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Session, User } from "@supabase/supabase-js"
import Dashboard from "./Dashboard"
import Login from "./Login"
import UpdatePassword from "./Alterar-Senha"

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false)
  const [userProfile, setUserProfile] = useState<{
    name: string
    cargo: string
    email: string
  } | null>(null)

  useEffect(() => {
    async function fetchAdminProfile(user: User) {
      const { data } = await supabase
        .from("administradores")
        .select("nome, cargo")
        .eq("id", user.id)
        .single()

      if (data) {
        setUserProfile({
          name: data.nome,
          email: user.email || "",
          cargo: data.cargo,
        })
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) fetchAdminProfile(session.user)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)

      if (session?.user) {
        fetchAdminProfile(session.user)
      } else {
        setUserProfile(null)
      }

      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveringPassword(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/20">
        <p className="animate-pulse font-medium text-muted-foreground">
          Carregando sistema...
        </p>
      </div>
    )
  }

  if (isRecoveringPassword) {
    // @ts-expect-error: UpdatePassword may not have typed props in this project context
    return <UpdatePassword onComplete={() => setIsRecoveringPassword(false)} />
  }

  if (!session) {
    return <Login />
  }

  return <Dashboard userProfile={userProfile} />
}

export default App
