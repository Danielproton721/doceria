"use client"

import Image from "next/image"
import { useState, useEffect, useCallback } from "react"
import { products, categories } from "@/lib/data"

const ALL_BANNERS = [
  {
    id: 1,
    src: "/banners/banner-24h.png",
    alt: "Bebida gelada na sua porta — aberta agora, entrega em minutos na sua região",
    ratio: "1672 / 941",
    action: "category" as const,
    categoryLink: "cervejas",
  },
  {
    id: 2,
    src: "/banners/banner2.webp",
    alt: "Monte seu combo! Precos imbativeis com 30% OFF",
    ratio: "16 / 7",
    action: "combo" as const,
    categoryLink: "",
  },
]

// Banner que leva pra coleção oculta (ou pro montador de combo sem destilados à venda) some junto.
const banners = ALL_BANNERS.filter((b) =>
  b.action === "combo"
    ? products.some((p) => p.category === "queridinhos")
    : categories.some((c) => c.id === b.categoryLink),
)

interface BannerCarouselProps {
  onBannerClick?: (categoryId: string) => void
  onComboClick?: () => void
}

export function BannerCarousel({ onBannerClick, onComboClick }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length)
  }, [])

  useEffect(() => {
    if (banners.length < 2) return
    const interval = setInterval(next, 5000)
    return () => clearInterval(interval)
  }, [next])

  if (banners.length === 0) return null

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-2">
      {/* O frame adapta à proporção do banner atual — cada banner aparece inteiro. */}
      <div
        className="relative overflow-hidden rounded-xl transition-[aspect-ratio] duration-500 ease-out"
        style={{ aspectRatio: banners[current].ratio }}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="relative h-full w-full flex-shrink-0 cursor-pointer"
              onClick={() => {
                if (banner.action === "combo" && onComboClick) {
                  onComboClick()
                } else if (banner.action === "category" && banner.categoryLink && onBannerClick) {
                  onBannerClick(banner.categoryLink)
                }
              }}
            >
              <Image
                src={banner.src}
                alt={banner.alt}
                fill
                className="object-cover rounded-xl"
                sizes="(max-width: 512px) 100vw, 512px"
                priority={banner.id === 1}
              />
            </div>
          ))}
        </div>
        {/* Indicadores */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation()
                setCurrent(i)
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-5 bg-background" : "w-1.5 bg-background/50"
              }`}
              aria-label={`Ir para banner ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
