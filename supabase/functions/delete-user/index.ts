import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { targetUserId } = await req.json()
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) throw new Error("Header de autorização ausente.")

    const supabaseAdmin = createClient(
      Deno.env.get('VITE_SUPABASE_URL') ?? '',
      Deno.env.get('VITE_SERVICE_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    // 1. Valida quem está pedindo a exclusão
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) throw new Error("Token inválido ou acesso negado.")

    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('administradores')
      .select('cargo')
      .eq('id', user.id)
      .single()

    if (adminError || adminData?.cargo !== 'master') {
      throw new Error("Apenas cargos master podem deletar usuários.")
    }

    if (user.id === targetUserId) {
      throw new Error("Você não pode deletar sua própria conta.")
    }

    // 2. Deleta da tabela pública (caso não tenha cascata ativada no banco)
    await supabaseAdmin.from('administradores').delete().eq('id', targetUserId)

    // 3. Deleta do sistema de Autenticação
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    const erroReal = error instanceof Error ? error.message : JSON.stringify(error)
    return new Response(JSON.stringify({ error: erroReal }), { status: 400, headers: corsHeaders })
  }
})