import { NextResponse } from "next/server"

import { renderAbandonedCartEmail, renderOrderConfirmationEmail } from "@/lib/order-email"
import { sampleOrder } from "@/lib/order-email-sample"

export const dynamic = "force-dynamic"

// Abre o modelo do e-mail no navegador, com um pedido de exemplo.
// ?tipo=pendente mostra o de carrinho abandonado.
export async function GET(request: Request) {
  const tipo = new URL(request.url).searchParams.get("tipo")
  const order = sampleOrder()
  const { html } = tipo === "pendente" ? renderAbandonedCartEmail(order) : renderOrderConfirmationEmail(order)
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } })
}
