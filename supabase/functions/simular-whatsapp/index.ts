import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders })
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) throw new Error("Header de autorização ausente.")

    const supabaseAdmin = createClient(
      Deno.env.get("VITE_SUPABASE_URL") ?? "",
      Deno.env.get("VITE_SERVICE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    // 1. Autenticação: quem é?
    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) throw new Error("Token inválido ou acesso negado.")

    // 2. Autorização: super_admin OU master da própria empresa
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("administradores")
      .select("cargo, empresa_id")
      .eq("id", user.id)
      .single()
    if (adminError)
      throw new Error("Falha ao ler privilégios do usuário logado.")

    const backendUrl = Deno.env.get("KOYEB_BACKEND_URL")
    const secret = Deno.env.get("PROVISION_SECRET")
    if (!backendUrl || !secret)
      throw new Error("Backend de simulação não configurado.")

    const autorizado = (empresaId: string) =>
      adminData?.cargo === "super_admin" ||
      (adminData?.cargo === "master" && adminData?.empresa_id === empresaId)

    // 3. GET: listar conversas da empresa ou a transcrição de uma conversa
    if (req.method === "GET") {
      const url = new URL(req.url)
      const empresaId = url.searchParams.get("empresaId")
      const numero = url.searchParams.get("numero")
      if (!empresaId) throw new Error("Informe empresaId.")
      if (!autorizado(empresaId))
        throw new Error("Sem permissão para simular nesta empresa.")

      const path = numero
        ? `/simular/${empresaId}?numero=${encodeURIComponent(numero)}`
        : `/simular/${empresaId}`
      const resp = await fetch(`${backendUrl}${path}`, {
        headers: { Authorization: `Bearer ${secret}` },
      })
      const corpo = await resp.json()
      if (!resp.ok) throw new Error(corpo.error || "Falha ao listar simulação.")

      return new Response(JSON.stringify(corpo), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    // 4. POST: envia a mensagem digitada pelo "cidadão" simulado
    const { empresaId, numero, texto } = await req.json()
    if (
      !empresaId ||
      !numero ||
      typeof texto !== "string" ||
      texto.trim() === ""
    )
      throw new Error("Informe empresaId, numero e texto.")
    if (!autorizado(empresaId))
      throw new Error("Sem permissão para simular nesta empresa.")

    const resp = await fetch(`${backendUrl}/simular`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ empresaId, numero, texto }),
    })
    const corpo = await resp.json()
    if (!resp.ok) throw new Error(corpo.error || "Falha ao enviar no simulador.")

    return new Response(JSON.stringify(corpo), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error: unknown) {
    const erroReal =
      error instanceof Error ? error.message : JSON.stringify(error)
    return new Response(JSON.stringify({ error: erroReal }), {
      status: 400,
      headers: corsHeaders,
    })
  }
})