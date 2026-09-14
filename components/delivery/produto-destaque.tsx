"use client"

import Image from "next/image"
import { Star } from "lucide-react"
import { products } from "@/lib/data"
import type { Product } from "@/lib/types"

// Vitrine do carro-chefe no topo da home. Some sozinha se o produto sair do catálogo.
const DESTAQUE_ID = "cravejado-3"
const OUTRAS_OPCOES = [
  { id: "cravejado-tradicional", rotulo: "Compre 1 leve 2" },
  { id: "cravejado-6", rotulo: "6 unidades" },
  { id: "kit-cravejado-12-4", rotulo: "Kit 12 + 4 uvas" },
]

const brl = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`

export function ProdutoDestaque({ onSelect }: { onSelect: (product: Product) => void }) {
  const destaque = products.find((p) => p.id === DESTAQUE_ID)
  if (!destaque) return null

  const opcoes = OUTRAS_OPCOES.flatMap(({ id, rotulo }) => {
    const product = products.find((p) => p.id === id)
    return product ? [{ product, rotulo }] : []
  })
  const desconto = destaque.originalPrice ? Math.round((1 - destaque.price / destaque.originalPrice) * 100) : 0

  return (
    <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-5 h-5 fill-promo text-promo" />
        <h2 className="text-lg font-bold text-foreground">Destaque da casa</h2>
      </div>

      <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
        <button
          type="button"
          onClick={() => onSelect(destaque)}
          className="block w-full text-left active:scale-[0.99] transition-transform"
        >
          <div className="relative aspect-[5/4] w-full bg-secondary/30">
            <Image
              src={destaque.image}
              alt={destaque.name}
              fill
              sizes="(max-width: 512px) 100vw, 512px"
              className="object-cover object-top"
            />
            {desconto > 0 && (
              <span className="absolute top-3 left-3 bg-promo text-promo-foreground text-xs font-bold px-2 py-1 rounded-md shadow">
                -{desconto}%
              </span>
            )}
            {destaque.badge && (
              <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md shadow">
                {destaque.badge}
              </span>
            )}
          </div>

          <div className="p-4">
            <h3 className="text-xl font-extrabold text-foreground leading-tight">{destaque.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{destaque.description}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                {destaque.originalPrice && (
                  <span className="block text-xs text-muted-foreground line-through">{brl(destaque.originalPrice)}</span>
                )}
                <span className="text-2xl font-extrabold text-primary">{brl(destaque.price)}</span>
              </div>
              <span className="shrink-0 rounded-full bg-primary text-primary-foreground text-sm font-bold px-5 py-2.5 shadow-md">
                Pedir agora
              </span>
            </div>
          </div>
        </button>

        {opcoes.length > 0 && (
          <div className="border-t border-border py-3">
            <p className="px-4 text-xs font-semibold text-muted-foreground mb-2">Também temos</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4">
              {opcoes.map(({ product, rotulo }) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onSelect(product)}
                  className="flex-shrink-0 flex items-center gap-2 rounded-full border border-border bg-secondary/40 pl-1 pr-3 py-1 hover:border-primary/40 active:scale-95 transition"
                >
                  <span className="relative w-8 h-8 rounded-full overflow-hidden bg-secondary">
                    <Image src={product.image} alt="" fill sizes="32px" className="object-cover" />
                  </span>
                  <span className="text-xs font-semibold text-foreground whitespace-nowrap">{rotulo}</span>
                  <span className="text-xs font-bold text-primary whitespace-nowrap">{brl(product.price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
