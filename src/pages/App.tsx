import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Session, User } from "@supabase/supabase-js"
import { Routes, Route, Navigate } from "react-router"

import Login from "../Login"
import ChamadosTodos from "./chamados/index"
import ChamadosMeus from "./chamados/meus"
import ChamadosAbertos from "./chamados/abertos"
import ChamadosFinalizados from "./chamados/finalizados"
import Dashboard from "./Dashboard"
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

  return (
    <Routes>
      {/* O Dashboard agora é a Rota Pai (Layout). Ele envolve tudo. */}
      <Route path="/" element={<Dashboard userProfile={userProfile} />}>
        {/* Telas que vão ser renderizadas DENTRO do <Outlet /> do Dashboard */}
        {/* "index" é a página inicial padrão quando loga (ex: os gráficos de visão geral) */}
        <Route
          index
          element={<div>Página Inicial de Visão Geral (Em breve)</div>}
        />

        <Route path="chamados" element={<ChamadosTodos />} />
        <Route path="chamados/meus" element={<ChamadosMeus />} />
        <Route path="chamados/abertos" element={<ChamadosAbertos />} />
        <Route path="chamados/finalizados" element={<ChamadosFinalizados />} />

        <Route path="faq" element={<div>FAQ</div>} />

        <Route
          path="admin/usuarios"
          element={<div>Tela de Usuários (Acesso Master)</div>}
        />
        <Route
          path="admin/usuarios/novo"
          element={<div>Novo Usuário (Acesso Master)</div>}
        />

        <Route
          path="admin/whatsapp"
          element={<div>Gerenciar Bot Whatsapp (Acesso Master)</div>}
        />

        <Route
          path="admin/empresa"
          element={<div>Gerenciar Dados Empresa (Acesso Master)</div>}
        />

        <Route path="config" element={<div>Configurações Geral</div>} />

        <Route path="conta" element={<div>Configurações da Conta</div>} />
        <Route path="notificacoes" element={<div>Notificações</div>} />
      </Route>

      {/* Rota de segurança: Se o usuário digitar uma URL que não existe, manda de volta pro painel */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
