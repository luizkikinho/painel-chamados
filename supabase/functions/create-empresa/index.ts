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
    const { nome } = await req.json()
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

    // 2. Autorização: só o topo da pirâmide
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("administradores")
      .select("cargo")
      .eq("id", user.id)
      .single()
    if (adminError)
      throw new Error("Falha ao ler privilégios do usuário logado.")
    if (adminData?.cargo !== "super_admin")
      throw new Error("Apenas o super admin pode criar empresas.")

    // 3. Cria a empresa
    const { data: empresa, error: empError } = await supabaseAdmin
      .from("empresas")
      .insert({ name: nome, status: true })
      .select("id")
      .single()
    if (empError) throw empError

    // 4. Provisiona no Koyeb (segredo server-side)
    const resp = await fetch(
      `${Deno.env.get("KOYEB_BACKEND_URL")}/provisionar/${empresa.id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("PROVISION_SECRET")}`,
        },
      }
    )

    if (!resp.ok) {
      await supabaseAdmin.from("empresas").delete().eq("id", empresa.id)
      throw new Error(`Falha no provisionamento: ${await resp.text()}`)
    }

    const { instanceName, qrBase64 } = await resp.json()
    return new Response(
      JSON.stringify({ empresaId: empresa.id, instanceName, qrBase64 }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error: unknown) {
    const erroReal =
      error instanceof Error ? error.message : JSON.stringify(error)
    return new Response(JSON.stringify({ error: erroReal }), {
      status: 400,
      headers: corsHeaders,
    })
  }
})
