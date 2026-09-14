import { NextResponse } from "next/server"
import { claimOrderEmail, getOrderSnapshot, kvConfigured, markOrderPaid, releaseOrderEmail } from "@/lib/order-store"
import { sendOrderEmail, validateOrderInput } from "@/lib/send-order-email"

export const dynamic = "force-dynamic"

// Mesmos status liquidados das rotas de pagamento. "authorized" fica de fora
// (pre-autorizacao de cartao = dinheiro ainda nao capturado).
function isPaidStatus(status: unknown) {
  return ["paid", "captured", "succeeded", "completed", "approved", "pago"].includes(
    String(status ?? "").toLowerCase()
  )
}

// A Pagou.ai pode mandar o payload em formatos diferentes; extraimos txid+status
// de forma tolerante.
function extract(body: any): { txid: string | null; status: string | null } {
  const t = body?.data ?? body?.transaction ?? body ?? {}
  const txid = t?.id ?? t?.transactionId ?? t?.txid ?? body?.id ?? body?.txid ?? null
  const status = t?.status ?? body?.status ?? null
  return { txid: txid ? String(txid) : null, status: status ? String(status) : null }
}

export async function POST(request: Request) {
  // Relay externo: quando RELAY_SECRET existe, exige x-relay-secret.
  // Sem RELAY_SECRET, mantem a validacao antiga e continua aceitando sem segredo
  // quando PAGOUAI_WEBHOOK_SECRET tambem nao estiver configurado.
  const relaySecret = process.env.RELAY_SECRET?.trim()
  if (relaySecret) {
    const provided = (request.headers.get("x-relay-secret") || "").trim()
    if (provided !== relaySecret) {
      return NextResponse.json({ error: "Nao autorizado." }, { status: 401 })
    }
  } else {
    const secret = process.env.PAGOUAI_WEBHOOK_SECRET
    if (secret) {
      const url = new URL(request.url)
      const provided =
        url.searchParams.get("secret") ||
        request.headers.get("x-webhook-secret") ||
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
        ""
      if (provided !== secret) {
        return NextResponse.json({ error: "Nao autorizado." }, { status: 401 })
      }
    }
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: true }) // ack mesmo sem corpo valido
  }

  const { txid, status } = extract(body)

  // Sempre 200 pra Pagou nao ficar reenviando; a logica e best effort.
  if (!txid || !isPaidStatus(status)) {
    return NextResponse.json({ ok: true, handled: false, reason: "ignorado" })
  }
  if (!kvConfigured()) {
    console.warn("[WEBHOOK] KV nao configurado; nada a processar.")
    return NextResponse.json({ ok: true, handled: false, reason: "sem-kv" })
  }

  try {
    // Marca como pago ja; independe do snapshot/e-mail. Impede o e-mail de abandono.
    await markOrderPaid(txid).catch(() => {})

    const order = await getOrderSnapshot(txid)
    if (!order) {
      console.warn(`[WEBHOOK] Sem snapshot pro txid ${txid}.`)
      return NextResponse.json({ ok: true, handled: false, reason: "sem-snapshot" })
    }

    const invalid = validateOrderInput(order)
    if (invalid) {
      console.error(`[WEBHOOK] Snapshot invalido (${txid}): ${invalid}`)
      return NextResponse.json({ ok: true, handled: false, reason: "snapshot-invalido" })
    }

    // Trava de e-mail unico: se o front ja enviou, claim devolve false.
    const won = await claimOrderEmail(txid)
    if (!won) {
      return NextResponse.json({ ok: true, handled: false, reason: "ja-enviado" })
    }

    const result = await sendOrderEmail(order)
    if (!result.ok) {
      console.error(`[WEBHOOK] Falha ao enviar e-mail (${txid}):`, result.error)
      // Libera a trava pra um retry do webhook poder tentar de novo.
      await releaseOrderEmail(txid).catch(() => {})
      return NextResponse.json({ ok: true, handled: false, reason: "email-falhou" })
    }

    return NextResponse.json({ ok: true, handled: true })
  } catch (e) {
    console.error("[WEBHOOK] Erro inesperado:", e)
    return NextResponse.json({ ok: true, handled: false, reason: "erro" })
  }
}
