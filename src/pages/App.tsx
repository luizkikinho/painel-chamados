import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Session, User } from "@supabase/supabase-js"
import { Routes, Route, Navigate } from "react-router"

import Login from "./Login"
import VisaoGeral from "./VisaoGeral"
import ChamadosTodos from "./chamados/index"
import ChamadosMeus from "./chamados/meus"
import ChamadosAbertos from "./chamados/abertos"
import ChamadosFinalizados from "./chamados/finalizados"
import Dashboard from "./Dashboard"
import UpdatePassword from "./Alterar-Senha"

import { Toaster } from "sonner"
import { Spinner } from "@/components/ui/spinner"

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
        .from("administradores_api")
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
      <div className="flex h-[100dvh] w-full items-center justify-center bg-muted/20">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (isRecoveringPassword) {
    // @ts-expect-error: UpdatePassword may not have typed props in this project context
    return <UpdatePassword onComplete={() => setIsRecoveringPassword(false)} />
  }

  return (
    <>
      <Routes>
        {/* ROTA PÚBLICA */}
        {/* Se não tiver logado, mostra o Login. Se já estiver logado, joga para o painel principal */}
        <Route
          path="/login"
          element={!session ? <Login /> : <Navigate to="/" replace />}
        />

        {/* ROTAS PROTEGIDAS */}
        {/* Só monta o Dashboard e as rotas filhas se existir uma sessão válida */}
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
        )}

        {/* ROTA FALLBACK (CATCH-ALL) */}
        {/* Se tentar acessar algo não mapeado ou tentar burlar o acesso, redireciona */}
        <Route
          path="*"
          element={<Navigate to={session ? "/" : "/login"} replace />}
        />
      </Routes>

      <Toaster position="top-center" />
    </>
  )
}

export default App
