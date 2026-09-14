"use client"

import { useEffect, useState } from "react"

// Contador "ao vivo" de visitantes na loja. Atualiza sozinho a cada 10s.
// Depende de a loja mandar heartbeats pro /api/presence (veja o README).
export function OnlineCount() {
  const [online, setOnline] = useState<number | null>(null)

  useEffect(() => {
    let stopped = false
    const load = async () => {
      try {
        const r = await fetch("/api/presence", { cache: "no-store" })
        const d = await r.json()
        if (!stopped) setOnline(typeof d?.online === "number" ? d.online : 0)
      } catch {
        if (!stopped) setOnline(null)
      }
    }
    load()
    const interval = setInterval(load, 10_000)
    return () => {
      stopped = true
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </span>
      <span className="text-sm font-bold text-emerald-700">
        {online ?? "—"} {online === 1 ? "pessoa" : "pessoas"} online
      </span>
    </div>
  )
}
