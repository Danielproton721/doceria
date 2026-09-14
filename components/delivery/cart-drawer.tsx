"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Minus, Plus, Trash2, Pencil, ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { copaAtiva } from "@/lib/copa"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { UpsellCombo } from "./upsell-combo"
import { UpsellComida, UPSELL_PRODUCT_IDS } from "./upsell-comida"
import { products } from "@/lib/data"

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  onNavigateToCategory?: (categoryId: string) => void
}

const MIN_ORDER_VALUE = 85
// Único produto que pode furar o pedido mínimo (usado pra testes de checkout).
const TEST_PRODUCT_ID = "teste-5"
// Valor de frete "de" (riscado) só para evidenciar a economia da entrega grátis.
const DELIVERY_STRIKE = 9.9

export function CartDrawer({ isOpen, onClose, onNavigateToCategory }: CartDrawerProps) {
  const { items, totalPrice, totalItems, updateQuantity, removeItem, clearCart, addCombo, coupon, discount, discountRate, totalWithDiscount, applyCoupon, removeCoupon } = useCart()
  const router = useRouter()
  const [showUpsellComida, setShowUpsellComida] = useState(false)
  const [editingComboId, setEditingComboId] = useState<string | null>(null)
  const [showComboBuilder, setShowComboBuilder] = useState(false)
  const [couponInput, setCouponInput] = useState("")
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return
    const ok = applyCoupon(couponInput)
    setCouponMsg(ok ? { ok: true, text: "Cupom aplicado! 🎉" } : { ok: false, text: "Cupom inválido." })
    if (ok) setCouponInput("")
  }

  const hasUpsellItemInCart = items.some((item) => UPSELL_PRODUCT_IDS.includes(item.product.id))
  // Pratos em coleção oculta = nada pra oferecer: pula o "Bateu a fome?" antes do checkout.
  const upsellDisponivel = products.some((p) => UPSELL_PRODUCT_IDS.includes(p.id))

  // O produto de teste libera o checkout mesmo abaixo do mínimo.
  const hasTestProduct = items.some((item) => item.product.id === TEST_PRODUCT_ID)
  const canCheckout = totalPrice >= MIN_ORDER_VALUE || hasTestProduct
  const remainingValue = MIN_ORDER_VALUE - totalPrice

  // Total "de" (sem desconto) para mostrar o riscado no resumo.
  const originalTotal = items.reduce((sum, item) => {
    const unit =
      item.product.originalPrice && item.product.originalPrice > item.product.price
        ? item.product.originalPrice
        : item.product.price
    return sum + unit * item.quantity
  }, 0)
  const hasDiscount = originalTotal > totalPrice + 0.001

  const brl = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`

  const goToCheckout = () => {
    onClose()
    router.push("/checkout")
  }

  const handleCheckout = () => {
    if (!canCheckout) return
    if (upsellDisponivel && !hasUpsellItemInCart) {
      setShowUpsellComida(true)
    } else {
      goToCheckout()
    }
  }

  const handleUpsellClose = () => {
    setShowUpsellComida(false)
  }

  const handleUpsellSkip = () => {
    setShowUpsellComida(false)
    goToCheckout()
  }

  const handleViewMenu = () => {
    setShowUpsellComida(false)
    onClose()
    if (onNavigateToCategory) {
      onNavigateToCategory("comida")
    }
  }

  // Lock body scroll on iOS Safari when cart is open
  useEffect(() => {
    if (!isOpen) return
    const scrollY = window.scrollY
    document.body.classList.add("drawer-open")
    document.body.style.top = `-${scrollY}px`

    return () => {
      document.body.classList.remove("drawer-open")
      document.body.style.top = ""
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div key="cart-drawer" className="safari-drawer-overlay z-50">
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[51] bg-card rounded-t-3xl max-h-[92dvh] max-h-[92svh] overflow-hidden flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.9 }}
          >
        <div className="max-w-lg mx-auto w-full flex flex-col flex-1 min-h-0">
          {/* Topbar: SACOLA */}
          <div className="flex-shrink-0 grid grid-cols-3 items-center px-2 py-3 border-b border-border bg-card">
            <button
              onClick={onClose}
              aria-label="Fechar sacola"
              className="justify-self-start p-2 rounded-full hover:bg-secondary active:scale-90 transition-all"
            >
              <ChevronDown className="w-6 h-6 text-primary" />
            </button>
            <h2 className="justify-self-center text-base font-extrabold tracking-wide text-foreground">SACOLA</h2>
            {items.length > 0 ? (
              <button
                onClick={clearCart}
                className="justify-self-end pr-2 text-sm font-bold text-primary hover:opacity-80 active:scale-95 transition-all"
              >
                Limpar
              </button>
            ) : (
              <span />
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-6">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-bold text-foreground">Sua sacola está vazia</p>
              <p className="text-sm text-muted-foreground mt-1">Adicione seus doces e aproveite o frete grátis.</p>
              <Button onClick={onClose} className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8">
                Ver produtos
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 min-h-0 safari-scroll">
                {/* Linha da loja */}
                <div className="flex items-center gap-3 py-4">
                  <div className="w-11 h-11 rounded-full bg-white ring-1 ring-border overflow-hidden flex items-center justify-center flex-shrink-0">
                    <Image src="/logo-lumi.png" alt="Lumi Doçura" width={44} height={44} className="object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-foreground leading-tight">Lumi Doçura</p>
                    <button
                      onClick={onClose}
                      className="text-sm font-bold text-primary hover:opacity-80 transition-opacity"
                    >
                      Adicionar mais itens
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-foreground pt-2 pb-1">Itens adicionados</h3>

                <div className="divide-y divide-border">
                  {items.map((item) => {
                    const discount =
                      item.product.originalPrice && item.product.originalPrice > item.product.price
                        ? Math.round(
                            ((item.product.originalPrice - item.product.price) / item.product.originalPrice) * 100,
                          )
                        : 0
                    return (
                      <div key={item.product.id} className="flex gap-3 py-4">
                        {/* Imagem + lápis de edição (combos) */}
                        <div className="relative w-16 h-16 flex-shrink-0">
                          {item.isCombo && item.comboItems ? (
                            <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5 bg-secondary rounded-xl overflow-hidden">
                              {item.comboItems.destilados[0] && (
                                <div className="relative">
                                  <Image src={item.comboItems.destilados[0].product.image || "/placeholder.svg"} alt="Destilado" fill className="object-cover" />
                                </div>
                              )}
                              {item.comboItems.gelos[0] && (
                                <div className="relative">
                                  <Image src={item.comboItems.gelos[0].product.image || "/placeholder.svg"} alt="Gelo" fill className="object-cover" />
                                </div>
                              )}
                              {item.comboItems.energeticos[0] && (
                                <div className="relative col-span-2">
                                  <Image src={item.comboItems.energeticos[0].product.image || "/placeholder.svg"} alt="Energetico" fill className="object-cover" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-xl overflow-hidden bg-secondary">
                              <Image
                                src={item.product.image || "/placeholder.svg"}
                                alt={item.product.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          {item.isCombo && (
                            <button
                              onClick={() => setEditingComboId(item.product.id)}
                              aria-label="Editar combo"
                              className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-card ring-1 ring-border shadow flex items-center justify-center active:scale-90 transition-transform"
                            >
                              <Pencil className="w-3.5 h-3.5 text-primary" />
                            </button>
                          )}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground line-clamp-1">
                            {item.isCombo ? "Combo 30% OFF" : item.product.name}
                          </h4>
                          {!item.isCombo && item.product.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.product.description}</p>
                          )}

                          {/* Preço de/por */}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="font-bold text-primary">{brl(item.product.price)}</span>
                            {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                              <span className="text-xs text-muted-foreground line-through">{brl(item.product.originalPrice)}</span>
                            )}
                            {discount > 0 && (
                              <span className="rounded-md bg-promo text-promo-foreground text-[10px] font-bold px-1.5 py-0.5">
                                -{discount}%
                              </span>
                            )}
                          </div>

                          {/* Conteúdo do combo */}
                          {item.isCombo && item.comboItems && (
                            <div className="mt-1">
                              {[...item.comboItems.destilados, ...item.comboItems.gelos, ...item.comboItems.energeticos].map((s) => (
                                <p key={s.product.id} className="text-xs text-muted-foreground line-clamp-1">
                                  {s.qty}x {s.product.name}
                                </p>
                              ))}
                            </div>
                          )}

                          {/* Adicionais / observação */}
                          {!item.isCombo && item.additionals && item.additionals.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">+ {item.additionals.map((a) => `${a.quantity > 1 ? `${a.quantity}x ` : ""}${a.additional.name}`).join(", ")}</p>
                          )}
                          {!item.isCombo && item.observation && (
                            <p className="text-xs text-muted-foreground mt-1">Obs: {item.observation}</p>
                          )}
                        </div>

                        {/* Stepper em caixa cinza */}
                        <div className="self-start flex items-center gap-0.5 bg-secondary rounded-xl p-1 h-9">
                          {item.isCombo ? (
                            <button
                              onClick={() => removeItem(item.product.id)}
                              aria-label="Remover"
                              className="w-7 h-7 flex items-center justify-center text-primary active:scale-90 transition-transform"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  item.quantity === 1 ? removeItem(item.product.id) : updateQuantity(item.product.id, item.quantity - 1)
                                }
                                aria-label={item.quantity === 1 ? "Remover" : "Diminuir"}
                                className="w-7 h-7 flex items-center justify-center text-primary active:scale-90 transition-transform"
                              >
                                {item.quantity === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                              </button>
                              <span className="w-6 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                aria-label="Aumentar"
                                className="w-7 h-7 flex items-center justify-center text-primary active:scale-90 transition-transform"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Adicionar mais itens */}
                <button
                  onClick={onClose}
                  className="w-full text-center py-4 text-sm font-bold text-primary hover:opacity-80 transition-opacity"
                >
                  Adicionar mais itens
                </button>

                {/* Upsell Combo - so mostra se nao tiver combo no carrinho */}
                {!items.some((item) => item.isCombo) && (
                  <div className="pb-2">
                    <UpsellCombo onAddCombo={addCombo} />
                  </div>
                )}

                {/* Resumo de valores */}
                <div className="mt-2 mb-4">
                  <h3 className="text-base font-bold text-foreground mb-3">Resumo de valores</h3>

                  {/* Cupom de desconto */}
                  <div className="mb-3">
                    {coupon ? (
                      <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
                        <span className="text-sm font-bold text-green-700">
                          Cupom {coupon} aplicado · -{Math.round(discountRate * 100)}%
                        </span>
                        <button onClick={removeCoupon} className="text-xs font-semibold text-green-700 underline">
                          remover
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <input
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value.toUpperCase())
                              setCouponMsg(null)
                            }}
                            onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                            placeholder="Cupom de desconto"
                            className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm uppercase tracking-wide outline-none focus:ring-2 focus:ring-primary/40"
                          />
                          <button
                            onClick={handleApplyCoupon}
                            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            Aplicar
                          </button>
                        </div>
                        {couponMsg && (
                          <p className={`mt-1.5 text-xs font-medium ${couponMsg.ok ? "text-green-600" : "text-red-600"}`}>
                            {couponMsg.text}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total dos itens</span>
                      <span className="flex items-center gap-2">
                        {hasDiscount && (
                          <span className="text-muted-foreground line-through">{brl(originalTotal)}</span>
                        )}
                        <span className="font-medium text-foreground">{brl(totalPrice)}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Entrega</span>
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground line-through">{brl(DELIVERY_STRIKE)}</span>
                        <span className="font-bold text-green-600">Grátis</span>
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Desconto ({coupon})</span>
                        <span className="font-bold text-green-600">- {brl(discount)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2.5 border-t border-border">
                      <span className="font-bold text-foreground text-lg">Total</span>
                      <span className="font-bold text-foreground text-lg">{brl(totalWithDiscount)}</span>
                    </div>
                  </div>

                  {!canCheckout && (
                    <p className="mt-3 text-xs text-center text-primary font-medium">
                      Faltam {brl(remainingValue)} para atingir o pedido mínimo de {brl(MIN_ORDER_VALUE)}
                    </p>
                  )}
                </div>
              </div>

              {copaAtiva() && (
                <div className="flex-shrink-0 bg-gradient-to-r from-[#007a2f] to-[#009c3b] px-4 py-1.5 text-center text-xs font-bold text-[#ffdf00]">
                  ⚽ Dia de jogo — peça agora e receba antes do apito
                </div>
              )}

              {/* Barra inferior: Total + Continuar */}
              <div className="flex-shrink-0 border-t border-border bg-card px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center gap-3">
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="text-[11px] text-muted-foreground">Total com entrega grátis</span>
                  <span className="font-extrabold text-foreground text-lg truncate">
                    {brl(totalWithDiscount)} <span className="text-xs font-medium text-muted-foreground">/ {totalItems} {totalItems === 1 ? "item" : "itens"}</span>
                  </span>
                </div>
                <Button
                  onClick={handleCheckout}
                  disabled={!canCheckout}
                  className={`flex-1 h-12 rounded-xl text-base font-bold transition-all duration-200 ${
                    canCheckout
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  Continuar
                </Button>
              </div>
            </>
          )}
        </div>
          </motion.div>

      {/* Modal de Edicao de Combo */}
      {editingComboId && (() => {
        const comboItem = items.find((i) => i.product.id === editingComboId)
        if (!comboItem?.comboItems) return null
        return (
          <UpsellCombo
            editMode={comboItem.comboItems}
            onAddCombo={(comboItems, comboPrice) => {
              removeItem(editingComboId)
              addCombo(comboItems, comboPrice)
              setEditingComboId(null)
            }}
            onCancelEdit={() => setEditingComboId(null)}
          />
        )
      })()}

      {/* Modal de Upsell Comida */}
      {showUpsellComida && (
        <UpsellComida
          onClose={handleUpsellClose}
          onContinue={handleUpsellClose}
          onSkip={handleUpsellSkip}
          onViewMenu={handleViewMenu}
        />
      )}

      {/* Modal de Combo Builder (via banner) */}
      {showComboBuilder && (
        <UpsellCombo
          startOpen
          onAddCombo={(comboItems, comboPrice) => {
            addCombo(comboItems, comboPrice)
            setShowComboBuilder(false)
          }}
          onCancelEdit={() => setShowComboBuilder(false)}
        />
      )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
