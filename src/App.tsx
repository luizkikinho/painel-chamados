import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Session } from "@supabase/supabase-js"
import Dashboard from "./Dashboard"
import Login from "./Login"

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verifica se já existe uma sessão ativa ao abrir o site
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    // Fica escutando as mudanças (quando o usuário loga ou clica em "Sair")
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Tela de loading inicial rápida
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/20">
        <p className="text-muted-foreground font-medium animate-pulse">Carregando sistema...</p>
      </div>
    )
  }

  // Se não tem sessão ativa, exibe obrigatoriamente o Login
  if (!session) {
    return <Login />
  }

  // Se tem sessão, exibe o Dashboard
  return <Dashboard />
}

export default App