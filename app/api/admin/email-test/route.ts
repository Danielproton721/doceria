import { NextResponse } from "next/server"
import { Resend } from "resend"

import { isAuthed } from "@/lib/admin-auth"
import { renderAbandonedCartEmail, renderOrderConfirmationEmail } from "@/lib/order-email"
import { sampleOrder } from "@/lib/order-email-sample"

export const dynamic = "force-dynamic"

const TIPOS = ["confirmacao", "abandonado"] as const
type Tipo = (typeof TIPOS)[number]

// Estado do Resend, pra aba mostrar o que falta antes de tentar enviar.
export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }
  return NextResponse.json({
    apiKeySet: Boolean(process.env.RESEND_API_KEY),
    from: process.env.RESEND_FROM_EMAIL || "(usando o padrão do código)",
    replyTo: process.env.RESEND_REPLY_TO || "(nenhum)",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "(nenhum — imagens do e-mail vão quebrar)",
  })
}

// Dispara UM e-mail de teste com o pedido de exemplo. Envia de verdade pelo
// Resend: serve pra checar domínio verificado, remetente e como chega na caixa.
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

  const to = String(body?.to || "").trim()
  const tipo = String(body?.tipo || "confirmacao") as Tipo
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ ok: false, error: "E-mail de destino inválido." }, { status: 400 })
  }
  if (!TIPOS.includes(tipo)) {
    return NextResponse.json({ ok: false, error: "Tipo de e-mail desconhecido." }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "RESEND_API_KEY não configurada — sem ela nada é enviado." },
      { status: 500 },
    )
  }

  const base = sampleOrder()
  const order = sampleOrder({ customer: { ...base.customer, email: to } })
  const { subject, html } =
    tipo === "abandonado" ? renderAbandonedCartEmail(order) : renderOrderConfirmationEmail(order)

  const from = process.env.RESEND_FROM_EMAIL || "Lumi Doçura <contato@lumidocura.shop>"

  try {
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from,
      to: [to],
      subject: `[TESTE] ${subject}`,
      html,
      replyTo: process.env.RESEND_REPLY_TO || undefined,
    })
    if (result.error) {
      return NextResponse.json(
        { ok: false, error: result.error.message || "O Resend recusou o envio.", from },
        { status: 502 },
      )
    }
    return NextResponse.json({ ok: true, id: result.data?.id ?? null, to, from, tipo })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Falha inesperada ao enviar." }, { status: 500 })
  }
}
