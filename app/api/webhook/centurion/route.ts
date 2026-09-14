import { NextResponse } from "next/server"
import { claimOrderEmail, getOrderSnapshot, kvConfigured, markOrderPaid, releaseOrderEmail } from "@/lib/order-store"
import { sendOrderEmail, validateOrderInput } from "@/lib/send-order-email"
import { getStatusCenturion } from "@/lib/gateways/centurion"

export const dynamic = "force-dynamic"

// SEM relay: a CenturionPay bate direto aqui (postbackUrl = este endpoint).
// A doc NÃO documenta o schema do postback (a página "Respostas de Webhook" é um
// placeholder vazio), então lemos o id de vários caminhos prováveis.
function extractId(body: any): string | null {
  const d = body?.data ?? body?.transaction ?? body ?? {}
  const id =
    d?.id ??
    d?.transactionId ??
    body?.transactionId ??
    body?.objectId ??
    body?.id ??
    null
  return id != null ? String(id) : null
}

export async function POST(request: Request) {
  // Segurança: se houver segredo configurado, exige bater (?secret= ou header).
  const secret = process.env.PAGOUAI_WEBHOOK_SECRET
  if (secret) {
    const url = new URL(request.url)
    const provided =
      url.searchParams.get("secret") ||
      request.headers.get("x-webhook-secret") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      ""
    if (provided !== secret) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
    }
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: true }) // ack mesmo sem corpo válido
  }

  const txid = extractId(body)
  if (!txid) {
    return NextResponse.json({ ok: true, handled: false, reason: "sem-id" })
  }
  if (!kvConfigured()) {
    return NextResponse.json({ ok: true, handled: false, reason: "sem-kv" })
  }

  try {
    // O postback da Centurion não tem assinatura documentada — NÃO confiamos no
    // corpo. Confirmamos o pagamento consultando a própria API antes de liberar.
    const st = await getStatusCenturion(txid)
    if (!st.ok || !st.paid) {
      return NextResponse.json({ ok: true, handled: false, reason: "nao-pago" })
    }

    await markOrderPaid(txid).catch(() => {})

    const order = await getOrderSnapshot(txid)
    if (!order) {
      return NextResponse.json({ ok: true, handled: false, reason: "sem-snapshot" })
    }

    const invalid = validateOrderInput(order)
    if (invalid) {
      console.error(`[WEBHOOK/Centurion] Snapshot inválido (${txid}): ${invalid}`)
      return NextResponse.json({ ok: true, handled: false, reason: "snapshot-invalido" })
    }

    const won = await claimOrderEmail(txid)
    if (!won) {
      return NextResponse.json({ ok: true, handled: false, reason: "ja-enviado" })
    }

    const result = await sendOrderEmail(order)
    if (!result.ok) {
      await releaseOrderEmail(txid).catch(() => {})
      return NextResponse.json({ ok: true, handled: false, reason: "email-falhou" })
    }

    return NextResponse.json({ ok: true, handled: true })
  } catch (e) {
    console.error("[WEBHOOK/Centurion] Erro inesperado:", e)
    return NextResponse.json({ ok: true, handled: false, reason: "erro" })
  }
}
