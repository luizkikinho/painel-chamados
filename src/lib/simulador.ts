import { supabase } from "@/lib/supabase"

const backendUrl = import.meta.env.VITE_BACKEND_URL as string | undefined
const secret = import.meta.env.VITE_PROVISION_SECRET as string | undefined

const authHeaders: Record<string, string> = secret
  ? { Authorization: `Bearer ${secret}` }
  : {}

async function parseCorpo(resp: Response) {
  const corpo = await resp.json().catch(() => null)
  if (!resp.ok) {
    throw new Error(corpo?.error ?? `Falha na resposta do backend (${resp.status}).`)
  }
  return corpo
}

export async function simuladorListar(empresaId: string) {
  if (backendUrl) {
    const resp = await fetch(`${backendUrl}/simular/${encodeURIComponent(empresaId)}`, {
      headers: authHeaders,
    })
    return parseCorpo(resp)
  }
  const { data, error } = await supabase.functions.invoke(
    `simular-whatsapp?empresaId=${encodeURIComponent(empresaId)}`,
    { method: "GET" }
  )
  if (error) throw new Error(error.message)
  return data
}

export async function simuladorEnviar(payload: {
  empresaId: string
  numero: string
  texto: string
}) {
  if (backendUrl) {
    const resp = await fetch(`${backendUrl}/simular`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(payload),
    })
    return parseCorpo(resp)
  }
  const { data, error } = await supabase.functions.invoke("simular-whatsapp", {
    body: payload,
  })
  if (error) throw new Error(error.message)
  return data
}