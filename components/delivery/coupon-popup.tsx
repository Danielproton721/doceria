"use client"

import { useEffect, useState } from "react"
import { X, Copy, Check } from "lucide-react"
import { useCart } from "@/lib/cart-context"

const COUPON_CODE = "PRIMEIRA"
// Espera ~7s DEPOIS que a verificação de idade e a localização foram resolvidas,
// pra não aparecer colado no fechamento desses popups.
const DELAY_AFTER_READY_MS = 7000

// Popup promocional da home: oferece o cupom de PRIMEIRA COMPRA (10% OFF).
// Aparece a cada carregamento, mas só começa a contar o tempo depois que o
// age-gate (localStorage `age_verified`) e a localização (localStorage
// `delivery_address`) já foram resolvidos. `suppressed` reflete o popup de
// localização aberto (estado do React na home).
export function CouponPopup({ suppressed = false }: { suppressed?: boolean }) {
  const { applyCoupon } = useCart()
  const [show, setShow] = useState(false)
  const [closed, setClosed] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (suppressed || closed) return

    let delayTimer: ReturnType<typeof setTimeout> | null = null

    const isReady = () => {
      try {
        return (
          localStorage.getItem("age_verified") === "true" &&
          !!localStorage.getItem("delivery_address")
        )
      } catch {
        return true // sem acesso ao storage: não trava o popup
      }
    }

    const startDelay = () => {
      if (delayTimer) return
      delayTimer = setTimeout(() => setShow(true), DELAY_AFTER_READY_MS)
    }

    if (isReady()) {
      startDelay()
      return () => {
        if (delayTimer) clearTimeout(delayTimer)
      }
    }

    // Ainda falta confirmar idade/localização: checa de tempos em tempos.
    const poll = setInterval(() => {
      if (isReady()) {
        clearInterval(poll)
        startDelay()
      }
    }, 400)

    return () => {
      clearInterval(poll)
      if (delayTimer) clearTimeout(delayTimer)
    }
  }, [suppressed, closed])

  const visible = show && !closed && !suppressed
  if (!visible) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(COUPON_CODE)
    } catch {
      // alguns navegadores bloqueiam o clipboard; segue aplicando o cupom
    }
    applyCoupon(COUPON_CODE) // já deixa aplicado no carrinho
    setCopied(true)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 animate-in fade-in"
      onClick={() => setClosed(true)}
    >
      <div
        className="relative w-full max-w-[330px] overflow-hidden rounded-2xl bg-card shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setClosed(true)}
          aria-label="Fechar"
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabeçalho promocional (paleta da loja: vermelho + amarelo) */}
        <div className="relative bg-primary px-5 py-7 text-center text-primary-foreground">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-promo">
            Presente de boas-vindas
          </p>
          <p className="mt-1 text-5xl font-black leading-none">
            10% <span className="text-promo">OFF</span>
          </p>
          <p className="mt-2 text-sm font-bold">na sua primeira compra 🍻</p>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2 rounded-xl border-2 border-dashed border-primary bg-primary/5 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Seu cupom</p>
              <p className="text-xl font-black tracking-widest text-primary">{COUPON_CODE}</p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-white transition ${
                copied ? "bg-emerald-600" : "bg-primary hover:bg-primary/90"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copiar
                </>
              )}
            </button>
          </div>

          {copied ? (
            <p className="text-center text-xs font-semibold text-emerald-700">
              ✓ Cupom aplicado! É só finalizar o pedido. 🍺
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Copie e use no carrinho pra garantir <span className="font-bold text-foreground">10% de desconto</span> na primeira compra.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
