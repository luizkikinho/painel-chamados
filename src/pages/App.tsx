import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"
import { Routes, Route, Navigate } from "react-router" // Certifique-se de usar react-router-dom se houver erro aqui
import { useIdleTimeout } from "@/hooks/use-idle-timeout"
import type { Session, User } from "@supabase/supabase-js"
import { UserContext, type UserProfile } from "@/lib/user-context"

import Login from "./Login"
import VisaoGeral from "./VisaoGeral"
import Dashboard from "./Dashboard"
import Conta from "./Conta"

import ChamadosTodos from "./chamados/index"
import ChamadosMeus from "./chamados/meus"
import ChamadosAbertos from "./chamados/abertos"
import ChamadosFinalizados from "./chamados/finalizados"
import UpdatePassword from "./Alterar-Senha"

import { Toaster, toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useIdleTimeout(30)

  useEffect(() => {
    async function fetchAdminProfile(user: User) {
      try {
        const { data, error } = await supabase
          .from("administradores")
          .select("nome, cargo")
          .eq("id", user.id)
          .single()

        if (error || !data) {
          console.error("Erro ao buscar perfil:", error)
          await supabase.auth.signOut()
          setUserProfile(null)
          return
        }

        setUserProfile({
          name: data.nome,
          email: user.email || "",
          cargo: data.cargo,
        })
      } catch (err) {
        console.error("Exceção fatal ao carregar perfil:", err)
        setUserProfile(null)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchAdminProfile(session.user)
      } else {
        setIsLoading(false) // Garante que a tela de loading saia se não houver sessão
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)

      if (session?.user) {
        fetchAdminProfile(session.user).finally(() => setIsLoading(false))
      } else {
        setUserProfile(null)
        setIsLoading(false)
      }

      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveringPassword(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Escuta mudanças na sessão do banco para derrubar o usuário em caso de novo login
  useEffect(() => {
    if (!session?.user?.id) return

    const channel = supabase
      .channel("listen-session")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "active_sessions",
          filter: `user_id=eq.${session.user.id}`,
        },
        async (payload) => {
          console.log("Evento do banco recebido:", payload) // <-- Verifique isso no F12
          toast.error(
            "Sessão encerrada. Novo login detectado em outro dispositivo."
          )
          await supabase.auth.signOut()
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Realtime da sessão conectado com sucesso!")
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user?.id])

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-muted/20">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (isRecoveringPassword) {
    // @ts-expect-error: Ignorado conforme código original
    return <UpdatePassword onComplete={() => setIsRecoveringPassword(false)} />
  }

  return (
    <UserContext.Provider value={{ userProfile, setUserProfile }}>
      <Routes>
        <Route
          path="/login"
          element={!session ? <Login /> : <Navigate to="/" replace />}
        />

        {session && (
          <Route path="/" element={<Dashboard userProfile={userProfile} />}>
            <Route index element={<VisaoGeral />} />

            <Route path="chamados" element={<ChamadosTodos />} />
            <Route path="chamados/meus" element={<ChamadosMeus />} />
            <Route path="chamados/abertos" element={<ChamadosAbertos />} />
            <Route
              path="chamados/finalizados"
              element={<ChamadosFinalizados />}
            />

            <Route path="faq" element={<div>FAQ</div>} />
            <Route
              path="admin/usuarios"
              element={<div>Tela de Usuários</div>}
            />
            <Route
              path="admin/usuarios/novo"
              element={<div>Novo Usuário</div>}
            />
            <Route
              path="admin/whatsapp"
              element={<div>Gerenciar Bot Whatsapp</div>}
            />
            <Route
              path="admin/empresa"
              element={<div>Gerenciar Dados Empresa</div>}
            />

            <Route path="config" element={<div>Configurações Geral</div>} />
            <Route path="conta" element={<Conta />} />
            <Route path="notificacoes" element={<div>Notificações</div>} />
          </Route>
        )}

        <Route
          path="*"
          element={<Navigate to={session ? "/" : "/login"} replace />}
        />
      </Routes>
      <Toaster position="top-center" />
    </UserContext.Provider>
  )
}

export default App
