import { NextResponse } from "next/server"

import {
  renderAbandonedCartEmail,
  renderOrderConfirmationEmail,
  renderReengagementEmail,
} from "@/lib/order-email"
import { MANUAL_CTA_DESCONTO, MANUAL_CTA_HREF, OFERTA_DESCONTO } from "@/lib/manual-email"
import { sampleOrder } from "@/lib/order-email-sample"

export const dynamic = "force-dynamic"

// Abre o modelo do e-mail no navegador, com um pedido de exemplo.
// ?tipo=pendente | desconto | reativacao (sem tipo = pagamento confirmado)
export async function GET(request: Request) {
  const tipo = new URL(request.url).searchParams.get("tipo")
  const order = sampleOrder()
  const { html } =
    tipo === "pendente"
      ? renderAbandonedCartEmail(order, { ctaHref: MANUAL_CTA_HREF })
      : tipo === "desconto"
        ? renderAbandonedCartEmail(order, { ctaHref: MANUAL_CTA_DESCONTO, oferta: OFERTA_DESCONTO })
        : tipo === "reativacao"
          ? renderReengagementEmail(order, { ctaHref: MANUAL_CTA_HREF })
          : renderOrderConfirmationEmail(order)
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } })
}
