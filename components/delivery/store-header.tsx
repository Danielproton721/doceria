"use client"

import { useState } from "react"
import { Star, MapPin, ChevronDown, ChevronRight, Search, Heart, Truck } from "lucide-react"
import Image from "next/image"

interface StoreHeaderProps {
  userAddress?: string | null
  onChangeAddress?: () => void
}

export function StoreHeader({ userAddress, onChangeAddress }: StoreHeaderProps) {
  const [favorited, setFavorited] = useState(false)

  // Extrai cidade do endereco
  const getCityFromAddress = (address: string) => {
    const parts = address.split(",")
    if (parts.length >= 2) {
      return parts[parts.length - 2]?.trim() || parts[parts.length - 1]?.trim()
    }
    return address
  }
  const city = userAddress ? getCityFromAddress(userAddress) : "Selecione sua cidade"

  const focusSearch = () => {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input"))
    const search = inputs.find((i) => /busc|procur|pesquis/i.test(i.placeholder || ""))
    if (search) {
      search.scrollIntoView({ behavior: "smooth", block: "center" })
      setTimeout(() => search.focus(), 300)
    }
  }

  return (
    <header className="bg-background">
      {/* Capa com a foto da fachada + escurecido sutil pra legibilidade */}
      <div className="relative h-40 w-full overflow-hidden bg-muted">
        <Image
          src="/store-front-cumpadi.png"
          alt="Fachada CumpadiFood"
          fill
          priority
          sizes="(max-width: 640px) 100vw, 640px"
          className="object-cover object-top"
        />
        {/* escurecido só o necessário pra deixar o endereço/ícones brancos legíveis */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/30" />

        <div className="relative max-w-lg mx-auto px-4 pt-4 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-500">
          {/* Endereco */}
          <button
            type="button"
            onClick={onChangeAddress}
            className="flex items-center gap-1.5 text-left min-w-0 active:scale-[0.98] transition-transform"
          >
            <MapPin className="w-4 h-4 text-white shrink-0" />
            <span className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-wide text-white/75 leading-tight">Receber em</span>
              <span className="flex items-center gap-1 text-sm font-bold text-white leading-tight truncate max-w-[190px]">
                <span className="truncate">{city}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              </span>
            </span>
          </button>

          {/* Acoes */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setFavorited((v) => !v)}
              aria-label="Favoritar loja"
              className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
            >
              <Heart className={`w-5 h-5 transition-colors ${favorited ? "fill-white text-white" : "text-white"}`} />
            </button>
            <button
              type="button"
              onClick={focusSearch}
              aria-label="Buscar produtos"
              className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Card branco sobreposto com logo redonda */}
      <div className="max-w-lg mx-auto px-4">
        <div className="-mt-12 relative bg-card rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-border/60 px-5 pt-12 pb-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Logo redonda sobreposta */}
          <div className="absolute -top-11 left-1/2 -translate-x-1/2">
            <div className="w-[88px] h-[88px] rounded-full bg-white ring-4 ring-card shadow-xl overflow-hidden flex items-center justify-center hover:scale-105 transition-transform duration-300">
              <Image
                src="/logo-cumpadi.png"
                alt="CumpadiFood"
                width={88}
                height={88}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Nome + chevron */}
          <button
            type="button"
            onClick={onChangeAddress}
            className="w-full flex items-center justify-between gap-2 group"
          >
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight leading-none">
              CumpadiFood
            </h1>
            <ChevronRight className="w-6 h-6 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Entrega rápida • 2,5 km • Mín R$ 85,00
          </p>

          <div className="my-4 border-t border-border" />

          {/* Avaliacao + status */}
          <button
            type="button"
            onClick={onChangeAddress}
            className="w-full flex items-center justify-between gap-2 group"
          >
            <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
              <span className="flex items-center gap-1 font-bold text-foreground">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                4,8
              </span>
              <span className="text-sm text-muted-foreground">(1360+ avaliações)</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600 text-white text-xs font-bold px-2.5 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                Aberta agora
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="my-4 border-t border-border" />

          {/* Entrega */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-green-600 shrink-0" />
                Frete Grátis • 30-80 min
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Receba em até 1h • Aceitamos Pix
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#fff1e8] text-[#e8202b] text-xs font-extrabold px-2.5 py-1">
              Grátis
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
