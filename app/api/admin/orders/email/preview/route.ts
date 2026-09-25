import { NextResponse } from "next/server"

import { isAuthed } from "@/lib/admin-auth"
import { getOrderSnapshot } from "@/lib/order-store"
import { renderAbandonedCartEmail, renderOrderConfirmationEmail } from "@/lib/order-email"

export const dynamic = "force-dynamic"

// ?formato=json devolve só o assunto (o painel mostra antes de enviar).
// Sem formato, devolve o HTML do e-mail pra abrir numa aba.
export async function GET(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const url = new URL(request.url)
  const txid = (url.searchParams.get("txid") || "").trim()
  const tipo = url.searchParams.get("tipo") || "abandonado"
  const formato = url.searchParams.get("formato")

  if (!txid) return NextResponse.json({ error: "Pedido não informado." }, { status: 400 })

  const pedido = await getOrderSnapshot(txid)
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 })

  const { subject, html } =
    tipo === "pago" ? renderOrderConfirmationEmail(pedido) : renderAbandonedCartEmail(pedido)

  if (formato === "json") return NextResponse.json({ ok: true, assunto: subject })
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } })
}
