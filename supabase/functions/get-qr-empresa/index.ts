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
    const { empresaId } = await req.json()
    if (!empresaId) throw new Error("Informe empresaId.")

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

    const ehSuperAdmin = adminData?.cargo === "super_admin"
    const ehMasterDaEmpresa =
      adminData?.cargo === "master" && adminData?.empresa_id === empresaId
    if (!ehSuperAdmin && !ehMasterDaEmpresa) {
      throw new Error("Sem permissão para conectar esta empresa.")
    }

    // 3. QR vem do Koyeb — a chave da Evolution nunca toca o navegador
    const resp = await fetch(
      `${Deno.env.get("KOYEB_BACKEND_URL")}/qr/${empresaId}`,
      {
        headers: {
          Authorization: `Bearer ${Deno.env.get("PROVISION_SECRET")}`,
        },
      }
    )
    if (!resp.ok) throw new Error(await resp.text())

    const { qrBase64 } = await resp.json()
    return new Response(JSON.stringify({ qrBase64 }), {
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
