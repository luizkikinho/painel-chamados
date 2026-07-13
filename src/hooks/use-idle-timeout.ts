import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

export function useIdleTimeout(minutos: number) {
  useEffect(() => {
    let timeoutId: number | undefined

    const resetTimer = () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId)
      // Converte minutos para milissegundos
      timeoutId = window.setTimeout(
        () => {
          supabase.auth.signOut()
        },
        minutos * 60 * 1000
      )
    }

    // Eventos que resetam o cronômetro
    const eventos = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
    ]

    eventos.forEach((evento) => document.addEventListener(evento, resetTimer))
    resetTimer()

    return () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId)
      eventos.forEach((evento) =>
        document.removeEventListener(evento, resetTimer)
      )
    }
  }, [minutos])
}
