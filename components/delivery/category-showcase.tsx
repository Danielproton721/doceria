"use client"

import Image from "next/image"
import { products } from "@/lib/data"
import { useCart } from "@/lib/cart-context"
import { ShoppingBag } from "lucide-react"

const HIGHLIGHT_IDS = ["cd-01", "cd-02", "cd-03", "cd-04", "cd-05", "cd-06", "cd-07", "cd-08", "cd-09", "cd-10", "cd-11"]

interface HighlightProductsProps {
  onProductSelect: (product: (typeof products)[0]) => void
  onComboClick?: () => void
}

const COMBO_CARD = {
  name: "Monte seu Combo",
  image: "https://cdn.shopify.com/s/files/1/0807/3173/4230/files/combos.png?v=1771976188",
}

export function HighlightProducts({ onProductSelect, onComboClick }: HighlightProductsProps) {
  const { addItem } = useCart()
  const highlightProducts = products.filter((p) => HIGHLIGHT_IDS.includes(p.id))

  if (highlightProducts.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-foreground mb-4">Combos Destaques</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 scroll-pl-4 snap-x snap-mandatory pb-2">
        {/* Card Monte seu Combo */}
        <div
          onClick={() => onComboClick?.()}
          className="flex-shrink-0 w-[42vw] max-w-[180px] snap-start bg-card rounded-xl overflow-hidden border-2 border-primary/30 shadow-sm cursor-pointer
            hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300
            animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
        >
          <div className="relative aspect-square w-full overflow-hidden bg-primary/5">
            <Image
              src={COMBO_CARD.image}
              alt={COMBO_CARD.name}
              fill
              className="object-contain p-2"
            />
            <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              COMBO
            </span>
          </div>
          <div className="p-3">
            <h3 className="font-bold text-sm text-foreground leading-tight">{COMBO_CARD.name}</h3>
            <span className="text-xs text-primary font-semibold mt-1 block">Clique e monte</span>
          </div>
        </div>

        {highlightProducts.map((product, index) => {
          const discount = product.originalPrice
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0

          return (
            <div
              key={product.id}
              onClick={() => onProductSelect(product)}
              className="flex-shrink-0 w-[42vw] max-w-[180px] snap-start bg-card rounded-xl overflow-hidden border border-border shadow-sm cursor-pointer
                hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300
                animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative aspect-square w-full overflow-hidden bg-secondary/30">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-contain p-2"
                />
                {discount > 0 && (
                  <span className="absolute top-2 left-2 bg-promo text-promo-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    -{discount}%
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    addItem(product, 1, [], "")
                  }}
                  className="absolute top-2 right-2 w-9 h-9 bg-accent rounded-full flex items-center justify-center shadow-lg
                    hover:scale-110 active:scale-95 transition-all duration-200 z-10"
                >
                  <ShoppingBag className="w-4 h-4 text-accent-foreground" />
                </button>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight">{product.name}</h3>
                <div className="mt-2">
                  {product.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through block">
                      R$ {product.originalPrice.toFixed(2).replace(".", ",")}
                    </span>
                  )}
                  <span className="text-base font-bold text-primary">
                    R$ {product.price.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
