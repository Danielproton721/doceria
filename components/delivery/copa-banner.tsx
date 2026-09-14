"use client"

import { useState, useEffect } from "react"
import { proximoJogo } from "@/lib/copa"

function Chip({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex flex-col items-center">
      <span className="min-w-[2.1rem] rounded-md bg-[#ffdf00] px-1.5 py-0.5 text-center text-base font-black tabular-nums text-[#0a3b1e] leading-none">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-white/80">{label}</span>
    </span>
  )
}

export function CopaBanner() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Evita mismatch de SSR: só renderiza depois de montar no cliente.
  if (!now) return null
  const jogo = proximoJogo(now)
  if (!jogo) return null

  const diff = new Date(jogo.data).getTime() - now.getTime()
  const aoVivo = diff <= 0

  const total = Math.max(0, diff)
  const dias = Math.floor(total / 86400000)
  const horas = Math.floor((total % 86400000) / 3600000)
  const min = Math.floor((total % 3600000) / 60000)
  const seg = Math.floor((total % 60000) / 1000)

  return (
    <div className="bg-background">
      <div className="max-w-lg mx-auto px-4 pt-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#007a2f] via-[#009c3b] to-[#007a2f] px-4 py-3 shadow-md">
          {/* brilho sutil */}
          <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-[#ffdf00]/20 blur-2xl" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#ffdf00]">
                {aoVivo ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                    </span>
                    Ao vivo agora
                  </>
                ) : (
                  <>🇧🇷 Dia de jogo</>
                )}
              </p>
              <p className="truncate text-base font-black text-white leading-tight">{jogo.titulo}</p>
              <p className="text-[11px] font-medium text-white/85">
                {aoVivo ? "Tá rolando! Garanta o gelo 🍺" : `${jogo.quando} · receba antes do apito 🍺`}
              </p>
              {!aoVivo && (
                <p className="mt-1 text-[10px] font-bold text-[#ffdf00]">🎟️ Cupom COPA = 5% OFF</p>
              )}
            </div>

            {aoVivo ? (
              <img
                src="/cupom-copa.png"
                alt="Use o cupom COPA e ganhe 5% de desconto"
                className="h-12 w-auto shrink-0 object-contain"
              />
            ) : (
              <div className="flex shrink-0 items-start gap-1.5">
                {dias > 0 && <Chip value={dias} label="dias" />}
                <Chip value={horas} label="h" />
                <Chip value={min} label="min" />
                {dias === 0 && <Chip value={seg} label="seg" />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
