import type { OrderEmailInput } from "./order-email"

// Pedido fictício usado nas prévias e no e-mail de teste do painel.
export const SAMPLE_TRACKING_CODE = "LD482910375BR"

export function sampleOrder(overrides: Partial<OrderEmailInput> = {}): OrderEmailInput {
  return {
    orderCode: "LD000000001LD",
    customer: {
      name: "Maria Oliveira",
      email: "cliente@exemplo.com",
      phone: "(11) 99999-0000",
      document: "111.444.777-35",
    },
    address: {
      street: "Rua das Flores",
      number: "120",
      complement: "Apto 42",
      neighborhood: "Centro",
      city: "Mauá",
      state: "SP",
      zip: "09310-000",
    },
    items: [
      { name: "Morango Cravejado — 3 Unidades", quantity: 1, price: 29.99, image: "/products/doces/cravejado-3.webp" },
      { name: "Travessa Kinder Bueno (G)", quantity: 1, price: 74.99, image: "/products/doces/travessa-kinder.webp" },
    ],
    subtotal: 104.98,
    shipping: 0,
    discount: 0,
    total: 104.98,
    paymentMethod: "pix",
    ...overrides,
  } as OrderEmailInput
}
