import { createClient } from '@supabase/supabase-js'

// Puxa as variáveis de ambiente configuradas no arquivo .env do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cria e exporta o cliente para ser usado no restante do painel (Dashboard, Topbar, Login)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)