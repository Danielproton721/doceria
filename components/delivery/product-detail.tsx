"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { ArrowLeft, Minus, Plus, UtensilsCrossed, Package } from "lucide-react"
import type { Product, Additional } from "@/lib/types"
import { additionals, allCategories, products, foodAdditionals } from "@/lib/data"
import { useCart } from "@/lib/cart-context"
import { useBackClose } from "@/hooks/use-back-close"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ProductDetailProps {
  product: Product
  onClose: () => void
  onSelectProduct?: (product: Product) => void
}

export function ProductDetail({ product, onClose, onSelectProduct }: ProductDetailProps) {
  const { addItem, freeAdditionalChosen, setFreeAdditionalChosen } = useCart()

  // Botão "voltar" do celular fecha o produto em vez de sair da loja.
  useBackClose(true, onClose)

  const [quantity, setQuantity] = useState(1)
  // Tamanho escolhido (só em produto com P/G). Começa no maior, que é o preço
  // anunciado na vitrine — assim o valor do card nunca mente pro cliente.
  const tamanhos = product.tamanhos ?? []
  const [tamanhoId, setTamanhoId] = useState(tamanhos.length ? tamanhos[tamanhos.length - 1].id : "")
  const tamanho = tamanhos.find((t) => t.id === tamanhoId)
  const precoAtual = tamanho ? tamanho.price : product.price
  // Sabor escolhido (só em produto com lista de sabores). Todos custam o mesmo;
  // o sabor entra no nome do item, pra cozinha e cliente verem o que foi pedido.
  const sabores = product.sabores ?? []
  const [sabor, setSabor] = useState(sabores[0] ?? "")
  const [selectedAdditionals, setSelectedAdditionals] = useState<
    Record<string, number>
  >({})

  // Lock body scroll on iOS Safari when product detail is open
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [])
  const [observation, setObservation] = useState("")

  // Com tamanho escolhido, o riscado só vale pro tamanho que tem esse preço.
  const precoDe = product.originalPrice && precoAtual === product.price ? product.originalPrice : null
  const discountPercent = precoDe ? Math.ceil(((precoDe - precoAtual) / precoDe) * 100) : null

  const suggestedProducts = useMemo(() => {
    const others = products.filter((p) => p.id !== product.id)
    const shuffled = [...others].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 10)
  }, [product.id])

  // Comida tem adicionais próprios (preferências grátis, até 2 de cada).
  // Bebida mantém o brinde "1 grátis no 1º pedido".
  const dishAdditionals = foodAdditionals[product.id]
  const isFood = Array.isArray(dishAdditionals) && dishAdditionals.length > 0
  const additionalsList = isFood ? dishAdditionals : additionals
  const MAX_PER_ADDITIONAL = isFood ? 2 : 1
  // Brinde do 1º pedido (gelo, copos…) só nas coleções que oferecem — doce não tem.
  const temBrinde = !isFood && allCategories.some((c) => c.id === product.category && c.brindeGratis)

  // (brinde de bebida) já escolhido?
  const alreadyChosen = temBrinde && freeAdditionalChosen !== null

  const handleAdditionalChange = (additionalId: string, delta: number) => {
    if (alreadyChosen) return

    setSelectedAdditionals((prev) => {
      const current = prev[additionalId] || 0
      const newValue = Math.max(0, Math.min(current + delta, MAX_PER_ADDITIONAL))
      if (newValue === 0) {
        const updated = { ...prev }
        delete updated[additionalId]
        return updated
      }
      return { ...prev, [additionalId]: newValue }
    })
  }

  const totalAdditionals = alreadyChosen ? 1 : Object.values(selectedAdditionals).reduce(
    (sum, qty) => sum + qty,
    0
  )

  const totalPrice = precoAtual * quantity

  const handleAddToCart = () => {
    const additionalsArray = Object.entries(selectedAdditionals)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({
        additional: additionalsList.find((a) => a.id === id) as Additional,
        quantity: qty,
      }))

    // Brinde de bebida: trava 1 grátis por pedido (não vale pra comida).
    if (temBrinde && !alreadyChosen && additionalsArray.length > 0) {
      setFreeAdditionalChosen(additionalsArray[0].additional)
    }

    // Cada combinação de tamanho/sabor vira uma linha própria no carrinho (ele
    // junta itens pelo id), já com o nome e o preço daquela escolha.
    const sufixoId = [tamanho?.id, sabor && sabor.toLowerCase().replace(/[^a-z0-9]+/gi, "-")]
      .filter(Boolean)
      .join("-")
    const sufixoNome = [tamanho?.nome, sabor].filter(Boolean).join(" · ")
    const escolhido = sufixoId
      ? {
          ...product,
          id: `${product.id}-${sufixoId}`,
          name: `${product.name} (${sufixoNome})`,
          price: precoAtual,
          originalPrice: precoDe ?? undefined,
        }
      : product
    addItem(escolhido, quantity, additionalsArray, observation)
    onClose()
  }

  return (
    <div data-product-scroll className="fixed inset-0 w-full h-full bg-background z-50 flex flex-col overflow-hidden animate-in fade-in duration-300" style={{ minHeight: '100vh', minHeight: '100dvh' } as React.CSSProperties}>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
      <div className="max-w-lg mx-auto pb-4 animate-in slide-in-from-bottom-8 duration-500 ease-out">
        <button
          onClick={onClose}
          className="fixed top-4 left-4 z-10 bg-accent text-accent-foreground px-4 py-2 rounded-full font-medium flex items-center gap-2 shadow-md
            hover:shadow-lg hover:scale-105 hover:bg-accent/90
            active:scale-95
            transition-all duration-200
            animate-in slide-in-from-left-4 duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          VOLTAR
        </button>

        <div className="relative aspect-square w-full max-h-[350px] overflow-hidden bg-secondary/30">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-contain p-4 animate-in zoom-in-95 duration-700 ease-out"
          />
        </div>

        <div className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          
          <div className="flex items-baseline gap-2 mt-2">
            {precoDe && (
              <span className="text-muted-foreground line-through">
                de R$ {precoDe.toFixed(2).replace(".", ",")} por
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-primary">
              R$ {precoAtual.toFixed(2).replace(".", ",")}
            </p>
            {discountPercent && (
              <Badge className="bg-primary text-primary-foreground font-bold text-sm px-2.5 py-1">
                -{discountPercent}%
              </Badge>
            )}
          </div>
          
          {product.stock && (
            <p className="text-sm text-accent font-medium mt-2">
              Apenas {product.stock} disponíveis
            </p>
          )}

          {tamanhos.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Escolha o tamanho</h2>
              <p className="text-sm text-muted-foreground mb-3">O preço muda conforme o tamanho.</p>
              <div className="flex gap-3">
                {tamanhos.map((t) => {
                  const ativo = t.id === tamanhoId
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTamanhoId(t.id)}
                      aria-pressed={ativo}
                      className={`flex-1 rounded-xl border-2 px-4 py-3 text-left transition-all duration-200 active:scale-[0.98] ${
                        ativo ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <span className="block text-base font-bold text-foreground">{t.nome}</span>
                      {t.detalhe && <span className="block text-xs text-muted-foreground">{t.detalhe}</span>}
                      <span className={`mt-0.5 block text-sm font-bold ${ativo ? "text-primary" : "text-muted-foreground"}`}>
                        R$ {t.price.toFixed(2).replace(".", ",")}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {sabores.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Escolha o sabor</h2>
              <p className="text-sm text-muted-foreground mb-3">Todos pelo mesmo preço.</p>
              <div className="flex flex-wrap gap-2">
                {sabores.map((s) => {
                  const ativo = s === sabor
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSabor(s)}
                      aria-pressed={ativo}
                      className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                        ativo
                          ? "border-primary bg-primary/5 text-primary shadow-sm"
                          : "border-border bg-card text-foreground hover:border-primary/40"
                      }`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Descrição</h2>
            
            {product.description && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {product.description}
              </p>
            )}

            {product.includes && product.includes.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-foreground font-medium mb-2">
                  <UtensilsCrossed className="w-4 h-4" />
                  O que vem no combo:
                </div>
                <ul className="text-muted-foreground text-sm space-y-1 ml-6">
                  {product.includes.map((item, index) => (
                    <li key={index} className="list-disc">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {product.accompaniments && product.accompaniments.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-foreground font-medium mb-2">
                  <Package className="w-4 h-4" />
                  Acompanhamentos:
                </div>
                <ul className="text-muted-foreground text-sm space-y-1 ml-6">
                  {product.accompaniments.map((item, index) => (
                    <li key={index} className="list-disc">{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {isFood ? (
            <div className="mt-6 rounded-xl border border-border p-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
              <div className="mb-3">
                <h3 className="font-semibold text-foreground">Adicionais</h3>
                <p className="text-sm text-muted-foreground">Opcional • grátis • até 2 de cada</p>
              </div>
              <div className="space-y-2">
                {additionalsList.map((additional) => {
                  const qv = selectedAdditionals[additional.id] || 0
                  return (
                    <div key={additional.id} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{additional.name}</p>
                        <p className="text-xs text-green-600 font-medium">Grátis</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleAdditionalChange(additional.id, -1)}
                          disabled={qv === 0}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary hover:scale-110 active:scale-90 disabled:opacity-40 transition-all duration-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className={`w-4 text-center font-medium text-foreground transition-all duration-200 ${qv > 0 ? "scale-125 text-primary" : ""}`}>{qv}</span>
                        <button
                          onClick={() => handleAdditionalChange(additional.id, 1)}
                          disabled={qv >= 2}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary hover:scale-110 active:scale-90 disabled:opacity-40 transition-all duration-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : temBrinde ? (
            <div className="mt-6 bg-primary/10 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">
                  {alreadyChosen ? "Adicional gratuito ja escolhido" : "Escolha um adicional gratuito"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {alreadyChosen 
                    ? `Voce escolheu: ${freeAdditionalChosen?.name}` 
                    : "Escolha ate 1 opcao"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {totalAdditionals}/1
                </span>
                {totalAdditionals >= 1 && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {alreadyChosen ? (
              <div className="bg-card rounded-lg p-3 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-primary-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="font-medium text-foreground text-sm">
                  {freeAdditionalChosen?.name} ({freeAdditionalChosen?.quantity})
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {additionals.map((additional) => (
                  <div
                    key={additional.id}
                    className="flex items-center justify-between bg-card rounded-lg p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        {additional.name} ({additional.quantity})
                      </p>
                      {additional.freeOnFirstOrder && (
                        <p className="text-xs text-primary">Gratis no 1o pedido</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleAdditionalChange(additional.id, -1)}
                        disabled={(selectedAdditionals[additional.id] || 0) === 0}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground 
                          hover:bg-secondary hover:scale-110 active:scale-90 
                          disabled:opacity-50 transition-all duration-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className={`w-4 text-center font-medium text-foreground transition-all duration-200 
                        ${(selectedAdditionals[additional.id] || 0) > 0 ? "scale-125 text-primary" : ""}`}>
                        {selectedAdditionals[additional.id] || 0}
                      </span>
                      <button
                        onClick={() => handleAdditionalChange(additional.id, 1)}
                        disabled={totalAdditionals >= 1}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground 
                          hover:bg-secondary hover:scale-110 active:scale-90 
                          disabled:opacity-50 transition-all duration-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          ) : null}

          <div className="mt-6">
            <h3 className="font-semibold text-foreground mb-2">
              Adicionar algum detalhe?
            </h3>
            <Textarea
              placeholder="Escreva o detalhe aqui..."
              value={observation}
              onChange={(e) => setObservation(e.target.value.slice(0, 140))}
              className="resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {observation.length}/140
            </p>
          </div>

          {/* Produtos Sugeridos */}
          <div className="mt-8">
            <h3 className="font-semibold text-foreground text-lg mb-4">Você também pode querer    </h3>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4">
              {suggestedProducts.map((suggestedProduct) => (
                <button
                  key={suggestedProduct.id}
                  type="button"
                  onClick={() => {
                    if (onSelectProduct) {
                      onSelectProduct(suggestedProduct)
                    }
                  }}
                  className="flex-shrink-0 w-[140px] bg-card border border-border rounded-xl overflow-hidden
                    hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left"
                >
                  <div className="relative w-full h-[120px] bg-secondary/30">
                    <Image
                      src={suggestedProduct.image || "/placeholder.svg"}
                      alt={suggestedProduct.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
                      {suggestedProduct.name}
                    </p>
                    <div className="mt-1 flex items-baseline gap-1">
                      {suggestedProduct.originalPrice && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          R$ {suggestedProduct.originalPrice.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-primary">
                      R$ {suggestedProduct.price.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
      </div>

      <div className="flex-shrink-0 bg-card border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div className="flex items-center gap-3 bg-secondary rounded-lg px-4 py-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="text-muted-foreground hover:text-foreground hover:scale-110 active:scale-90 disabled:opacity-50 transition-all duration-200"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="font-medium text-foreground w-6 text-center transition-all duration-200">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="text-muted-foreground hover:text-foreground hover:scale-110 active:scale-90 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <Button
            onClick={handleAddToCart}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] py-6 text-lg font-semibold transition-all duration-200"
          >
            Adicionar R$ {totalPrice.toFixed(2).replace(".", ",")}
          </Button>
        </div>
      </div>
    </div>
  )
}
