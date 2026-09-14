"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { categories } from "@/lib/data"
import Image from "next/image"

interface CategoryNavProps {
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
}

// 6 coleções por tela (3 colunas × 2 linhas); as demais ficam arrastando pro lado.
const POR_PAGINA = 6

export function CategoryNav({ activeCategory, onCategoryChange }: CategoryNavProps) {
  const trilho = useRef<HTMLDivElement>(null)
  const arrasto = useRef({ ativo: false, x: 0, scroll: 0, moveu: false })
  const [pagina, setPagina] = useState(0)

  const paginas: (typeof categories)[] = []
  for (let i = 0; i < categories.length; i += POR_PAGINA) paginas.push(categories.slice(i, i + POR_PAGINA))

  const irPara = (i: number) => {
    const el = trilho.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" })
  }

  // Coleção escolhida por fora (banner, carrinho) fica à vista.
  useEffect(() => {
    const i = categories.findIndex((c) => c.id === activeCategory)
    if (i >= 0) irPara(Math.floor(i / POR_PAGINA))
  }, [activeCategory])

  const aoRolar = () => {
    const el = trilho.current
    if (el && el.clientWidth) setPagina(Math.round(el.scrollLeft / el.clientWidth))
  }

  // No celular o dedo já arrasta sozinho; isto é pro MOUSE arrastar também.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !trilho.current) return
    arrasto.current = { ativo: true, x: e.clientX, scroll: trilho.current.scrollLeft, moveu: false }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = arrasto.current
    const el = trilho.current
    if (!a.ativo || !el) return
    const dx = e.clientX - a.x
    if (!a.moveu && Math.abs(dx) > 5) {
      a.moveu = true
      el.style.scrollSnapType = "none" // o snap brigaria com o arrasto
      el.setPointerCapture(e.pointerId)
    }
    if (a.moveu) el.scrollLeft = a.scroll - dx
  }

  const soltar = () => {
    const a = arrasto.current
    const el = trilho.current
    if (!a.ativo || !el) return
    a.ativo = false
    if (!a.moveu) return
    el.style.scrollSnapType = ""
    const inicio = Math.round(a.scroll / el.clientWidth)
    const andou = el.scrollLeft - a.scroll
    irPara(Math.max(0, Math.min(paginas.length - 1, inicio + (andou > 40 ? 1 : andou < -40 ? -1 : 0))))
  }

  // Soltar o mouse depois de arrastar não pode abrir a coleção que ficou embaixo dele.
  const onClickCapture = (e: React.MouseEvent) => {
    if (!arrasto.current.moveu) return
    e.preventDefault()
    e.stopPropagation()
    arrasto.current.moveu = false
  }

  return (
    <nav className="py-4">
      <div className="max-w-lg mx-auto">
        <div
          ref={trilho}
          onScroll={aoRolar}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={soltar}
          onPointerCancel={soltar}
          onClickCapture={onClickCapture}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide select-none cursor-grab active:cursor-grabbing"
        >
          {paginas.map((grupo, i) => (
            <div key={i} className="w-full flex-shrink-0 snap-start grid grid-cols-3 gap-y-4 px-4">
              {grupo.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 transition-all duration-200",
                    "hover:scale-105 active:scale-95"
                  )}
                >
                  <div
                    className={cn(
                      "w-[80px] h-[80px] rounded-2xl overflow-hidden border-2 transition-all duration-200 flex items-center justify-center bg-secondary/30",
                      activeCategory === category.id
                        ? "border-primary shadow-md shadow-primary/20"
                        : "border-transparent"
                    )}
                  >
                    <Image
                      src={category.icon}
                      alt={category.name}
                      width={96}
                      height={96}
                      draggable={false}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-medium text-center leading-tight w-[92px] line-clamp-2",
                      activeCategory === category.id
                        ? "text-foreground font-bold"
                        : "text-muted-foreground"
                    )}
                  >
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>

        {paginas.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {paginas.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ver coleções ${i + 1} de ${paginas.length}`}
                onClick={() => irPara(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  pagina === i ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
