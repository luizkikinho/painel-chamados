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
    const { email, nome, redirectTo, empresaId, cargoDestino } =
      await req.json()
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) throw new Error("Header de autorização ausente.")

    const supabaseAdmin = createClient(
      Deno.env.get("VITE_SUPABASE_URL") ?? "",
      Deno.env.get("VITE_SERVICE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) throw new Error("Token inválido ou acesso negado.")

    // 1. Resgata o cargo e o empresa_id de quem está logado
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("administradores")
      .select("cargo, empresa_id")
      .eq("id", user.id)
      .single()
    if (adminError)
      throw new Error("Falha ao ler privilégios do usuário logado.")

    // 2. Autorização: quem pode criar quem?
    let empresaFinal: string | null
    let cargoFinal: string

    if (adminData?.cargo === "super_admin") {
      // Super admin cria master (ou funcionario) na empresa que ele informar
      cargoFinal = cargoDestino === "master" ? "master" : "funcionario"
      empresaFinal = empresaId ?? null
      if (!empresaFinal)
        throw new Error("Informe a empresa (empresaId) para criar o usuário.")
    } else if (adminData?.cargo === "master") {
      // Master NUNCA cria master; só funcionarios da PRÓPRIA empresa
      cargoFinal = "funcionario"
      empresaFinal = adminData.empresa_id
      if (!empresaFinal)
        throw new Error("O master não possui uma empresa vinculada.")
    } else {
      throw new Error("Sem permissão para adicionar usuários.")
    }

    // 3. Gera o convite com a empresa final nos metadados (Multitenant JWT)
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email: email,
        options: {
          redirectTo: redirectTo,
          data: {
            nome: nome,
            empresa_id: empresaFinal,
          },
        },
      })
    if (linkError) throw linkError

    // 4. Insere na tabela pública com cargo e empresa finais
    const { error: insertError } = await supabaseAdmin
      .from("administradores")
      .insert([
        {
          id: linkData.user.id,
          nome: nome,
          cargo: cargoFinal,
          empresa_id: empresaFinal,
        },
      ])
    if (insertError) throw insertError

    return new Response(
      JSON.stringify({ link: linkData.properties.action_link }),
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
