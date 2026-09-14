"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { CartItem, Product, Additional } from "./types"

// Persistimos o carrinho para sobreviver à navegação até /checkout (e a reloads).
const STORAGE_KEY = "compadrefood-cart"
const COUPON_KEY = "compadrefood-coupon"

// Cupons válidos: código (MAIÚSCULO) -> percentual de desconto (0.10 = 10%).
// PRIMEIRA = cupom de primeira compra (10%) — alavanca de "pague o PIX agora".
// (O cupom COPA foi removido: a Copa acabou.)
const COUPONS: Record<string, number> = {
  PRIMEIRA: 0.10,
}

function loadCoupon(): string | null {
  if (typeof window === "undefined") return null
  try {
    const c = localStorage.getItem(COUPON_KEY)
    return c && COUPONS[c] ? c : null
  } catch {
    return null
  }
}

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // silent fail (modo privado / storage cheio)
  }
}

interface CartContextType {
  items: CartItem[]
  addItem: (
    product: Product,
    quantity: number,
    additionals: { additional: Additional; quantity: number }[],
    observation: string
  ) => void
  addCombo: (comboItems: { destilados: { product: Product; qty: number }[]; gelos: { product: Product; qty: number }[]; energeticos: { product: Product; qty: number }[] }, comboPrice: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  coupon: string | null
  discountRate: number
  discount: number
  totalWithDiscount: number
  applyCoupon: (code: string) => boolean
  removeCoupon: () => void
  freeAdditionalChosen: Additional | null
  setFreeAdditionalChosen: (additional: Additional | null) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [coupon, setCoupon] = useState<string | null>(null)
  const [freeAdditionalChosen, setFreeAdditionalChosen] = useState<Additional | null>(null)
  const [mounted, setMounted] = useState(false)

  // Hidrata do localStorage só no cliente (evita mismatch de SSR).
  useEffect(() => {
    setItems(loadCart())
    setCoupon(loadCoupon())
    setMounted(true)
  }, [])

  // Persiste a cada mudança (depois de hidratar, pra não sobrescrever com []).
  useEffect(() => {
    if (mounted) saveCart(items)
  }, [items, mounted])

  // Persiste o cupom aplicado (sobrevive à navegação pro /checkout).
  useEffect(() => {
    if (!mounted) return
    try {
      if (coupon) localStorage.setItem(COUPON_KEY, coupon)
      else localStorage.removeItem(COUPON_KEY)
    } catch {
      // silent
    }
  }, [coupon, mounted])

  const applyCoupon = (code: string): boolean => {
    const norm = code.trim().toUpperCase()
    if (COUPONS[norm]) {
      setCoupon(norm)
      return true
    }
    return false
  }

  const removeCoupon = () => setCoupon(null)

  const addItem = (
    product: Product,
    quantity: number,
    additionals: { additional: Additional; quantity: number }[],
    observation: string
  ) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id)
      if (existingIndex >= 0) {
        // Update imutável: nunca mutar o objeto que ainda está em `prev`.
        return prev.map((item, i) =>
          i === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        )
      }
      return [...prev, { product, quantity, additionals, observation }]
    })
  }

  const addCombo = (comboItems: { destilados: { product: Product; qty: number }[]; gelos: { product: Product; qty: number }[]; energeticos: { product: Product; qty: number }[] }, comboPrice: number) => {
    const comboId = `combo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const allItems = [...comboItems.destilados, ...comboItems.gelos, ...comboItems.energeticos]
    const descParts = allItems.map((i) => `${i.qty}x ${i.product.name}`).join(" + ")
    const comboProduct: Product = {
      id: comboId,
      name: "Combo 30% OFF",
      description: descParts,
      price: comboPrice,
      image: comboItems.destilados[0]?.product.image || "/placeholder.svg",
      category: "combo",
    }
    setItems((prev) => [
      ...prev,
      {
        product: comboProduct,
        quantity: 1,
        additionals: [],
        observation: "",
        isCombo: true,
        comboPrice,
        comboItems,
      },
    ])
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
    setFreeAdditionalChosen(null)
    setCoupon(null)
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  // Desconto do cupom aplicado sobre o subtotal.
  const discountRate = coupon ? COUPONS[coupon] ?? 0 : 0
  const discount = Math.round(totalPrice * discountRate * 100) / 100
  const totalWithDiscount = Math.max(0, Math.round((totalPrice - discount) * 100) / 100)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addCombo,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        coupon,
        discountRate,
        discount,
        totalWithDiscount,
        applyCoupon,
        removeCoupon,
        freeAdditionalChosen,
        setFreeAdditionalChosen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
