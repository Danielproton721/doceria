import { NextResponse } from "next/server"

import { isAuthed } from "@/lib/admin-auth"
import { getOrderEmailManual, getOrderSnapshot, markOrderEmailManual } from "@/lib/order-store"
import { sendAbandonedCartEmail, sendOrderEmail } from "@/lib/send-order-email"

export const dynamic = "force-dynamic"

// Tipos que a loja sabe montar hoje: a notinha do pedido pago e o lembrete de
// carrinho abandonado. (Os modelos "com desconto" e "reativação" da outra loja
// ainda não existem aqui.)
const TIPOS = ["pago", "abandonado"] as const
type Tipo = (typeof TIPOS)[number]

export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const txid = String(body?.txid || "").trim()
  const tipo = String(body?.tipo || "") as Tipo
  const confirmarReenvio = Boolean(body?.confirmarReenvio)

  if (!txid) return NextResponse.json({ error: "Pedido não informado." }, { status: 400 })
  if (!TIPOS.includes(tipo)) return NextResponse.json({ error: "Tipo de e-mail desconhecido." }, { status: 400 })

  const pedido = await getOrderSnapshot(txid)
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 })

  // Segunda vez só com confirmação explícita — evita mandar dois e-mails no clique errado.
  const jaEnviado = await getOrderEmailManual(txid)
  if (jaEnviado && !confirmarReenvio) {
    return NextResponse.json({ ok: false, jaEnviado }, { status: 409 })
  }

  const resultado = tipo === "pago" ? await sendOrderEmail(pedido) : await sendAbandonedCartEmail(pedido)
  if (!resultado.ok) {
    return NextResponse.json({ ok: false, error: resultado.error }, { status: resultado.status })
  }

  const enviadoEm = new Date().toISOString()
  await markOrderEmailManual(txid, enviadoEm).catch(() => {})
  return NextResponse.json({ ok: true, enviadoEm, tipo })
}
