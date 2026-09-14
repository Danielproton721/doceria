"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

export function RefreshButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [spinning, setSpinning] = useState(false)

  function recheck() {
    setSpinning(true)
    // force-dynamic: refresh reexecuta o server component e relê process.env.
    startTransition(() => {
      router.refresh()
      // Deixa o ícone girar um instante mesmo que o refresh seja rápido.
      setTimeout(() => setSpinning(false), 600)
    })
  }

  const busy = pending || spinning

  return (
    <button
      onClick={recheck}
      disabled={busy}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-bold text-foreground transition hover:bg-muted disabled:opacity-60"
    >
      <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
      {busy ? "Verificando..." : "Verificar novamente"}
    </button>
  )
}
