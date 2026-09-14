import { writeFileSync } from "fs"
import { renderOrderConfirmationEmail } from "../lib/order-email"

const { html } = renderOrderConfirmationEmail({
  orderCode: "AB482910XY",
  paymentMethod: "pix",
  customer: { name: "João da Silva", email: "joao@teste.com", phone: "(31) 99999-8888" },
  address: {
    cep: "32560-210",
    street: "Rua das Flores",
    number: "100",
    complement: "Apto 2",
    neighborhood: "Centro",
    city: "Betim",
    stateUF: "MG",
  },
  items: [
    { name: "Whisky Red Label 1L", price: 89.9, quantity: 1 },
    { name: "Guaraná Antártica 2L", price: 12.5, quantity: 2 },
  ],
  subtotal: 114.9,
  shipping: 0,
  total: 114.9,
})

writeFileSync("public/email-preview.html", html)
console.log("Preview gerado em public/email-preview.html")
