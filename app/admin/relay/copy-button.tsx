"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

type CopyButtonProps = {
  value: string
  disabled?: boolean
  label?: string
}

export function CopyButton({ value, disabled, label = "Copiar" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (disabled || !value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <button
      type="button"
      onClick={copy}
      disabled={disabled}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-bold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      title={copied ? "Copiado" : label}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copiado" : label}
    </button>
  )
}
