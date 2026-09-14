"use client"

import { useEffect } from "react"

function genId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  } catch {
    // ignora
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// Manda um "sinal de vida" a cada 30s pro /api/presence, pra contar visitantes
// online e visitantes únicos/dia no painel admin. O id é ESTÁVEL por navegador
// (localStorage) — sem isso cada reload viraria um "visitante único" novo.
// Não conta quem está no próprio /admin. Best-effort: falha nunca atrapalha.
export function PresenceTracker() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) return

    let id = ""
    try {
      id = localStorage.getItem("cf_sid") || ""
      if (!id) {
        id = genId()
        localStorage.setItem("cf_sid", id)
      }
    } catch {
      id = genId()
    }

    // Conta a visita única do dia UMA vez por navegador (trava no localStorage).
    // Dia no fuso BR (UTC-3) só como guarda anti-spam; o servidor decide o dia real
    // e o HLL deduplica o id de qualquer forma.
    let countToday = false
    try {
      const today = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
      if (localStorage.getItem("cf_day") !== today) {
        countToday = true
        localStorage.setItem("cf_day", today)
      }
    } catch {
      countToday = true
    }

    let stopped = false
    const beat = (count: boolean) => {
      if (stopped) return
      fetch("/api/presence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, count }),
        keepalive: true,
      }).catch(() => {})
    }

    beat(countToday)
    const interval = setInterval(() => beat(false), 30_000)
    const onVisible = () => {
      if (document.visibilityState === "visible") beat(false)
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      stopped = true
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])

  return null
}
