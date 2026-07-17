import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, nome, redirectTo } = await req.json()
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) throw new Error("Header de autorização ausente.")

    const supabaseAdmin = createClient(
      Deno.env.get('VITE_SUPABASE_URL') ?? '',
      Deno.env.get('VITE_SERVICE_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) throw new Error("Token inválido ou acesso negado.")

    // 1. Resgata o cargo e o empresa_id do master logado
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('administradores')
      .select('cargo, empresa_id')
      .eq('id', user.id)
      .single()

    if (adminError) throw new Error("Falha ao ler privilégios do usuário logado.")
    if (adminData?.cargo !== 'master') throw new Error("Apenas cargos master podem adicionar usuários.")
    if (!adminData.empresa_id) throw new Error("O master não possui uma empresa vinculada.")

    // 2. Gera o convite salvando o empresa_id nos metadados do Auth (Multitenant JWT)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: { 
        redirectTo: redirectTo,
        data: {
          nome: nome,
          empresa_id: adminData.empresa_id
        }
      }
    })
    
    if (linkError) throw linkError

    // 3. Insere o novo usuário na tabela pública vinculando à mesma empresa do master
    const { error: insertError } = await supabaseAdmin.from('administradores').insert([
      { 
        id: linkData.user.id, 
        nome: nome, 
        cargo: 'funcionario',
        empresa_id: adminData.empresa_id 
      }
    ])
    
    if (insertError) throw insertError

    return new Response(JSON.stringify({ link: linkData.properties.action_link }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: unknown) {
    const erroReal = error instanceof Error ? error.message : JSON.stringify(error)
    return new Response(JSON.stringify({ error: erroReal }), { status: 400, headers: corsHeaders })
  }
})