import { NextResponse } from "next/server"
import { generateOrderCode, kvConfigured, saveOrderSnapshot } from "@/lib/order-store"
import { qstashConfigured, scheduleDelayedCall } from "@/lib/qstash"
import { getActiveGateway, markTxGateway, type GatewayId } from "@/lib/gateways/active"
import { createPixMedusa, medusaConfigured } from "@/lib/gateways/medusa"
import { createPixCenturion, centurionConfigured } from "@/lib/gateways/centurion"
import { getPaymentNotifyUrl } from "@/lib/payment-notify-url"
import type { OrderEmailInput } from "@/lib/order-email"

export const dynamic = "force-dynamic"

// Atraso (em minutos) até checar abandono e disparar o e-mail "esqueceu o carrinho".
const ABANDONED_DELAY_MIN = 5

// Persiste o snapshot do pedido no KV + marca o gateway + agenda o e-mail de
// abandono. Compartilhado entre os fluxos Pagou.ai e MedusaPay. Best effort:
// nunca derruba o PIX.
async function persistPixOrder(
  txid: string | null,
  order: any,
  value: number,
  gateway: GatewayId
): Promise<void> {
  if (
    !txid ||
    !kvConfigured() ||
    !order?.customer?.email ||
    !Array.isArray(order?.items) ||
    order.items.length === 0 ||
    !order?.address
  ) {
    return
  }
  try {
    const snapshot: OrderEmailInput = {
      orderCode: generateOrderCode(String(txid)),
      paymentMethod: "pix",
      customer: order.customer,
      address: order.address,
      items: order.items,
      subtotal: Number(order.subtotal) || Number(value),
      shipping: Number(order.shipping) || 0,
      total: Number(order.total) || Number(value),
      // gclid do Google Ads (medição futura). Campo a mais no pedido; se não
      // veio de anúncio, fica sem — sem erro, não muda nada no fluxo.
      ...(order.gclid ? { gclid: String(order.gclid) } : {}),
    }
    await saveOrderSnapshot(String(txid), snapshot, Date.now())
    await markTxGateway(String(txid), gateway)

    // Agenda o e-mail de carrinho abandonado: se em ABANDONED_DELAY_MIN o pedido
    // não estiver pago, o QStash chama /api/abandoned/check.
    if (qstashConfigured()) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")
      const secret = process.env.PAGOUAI_WEBHOOK_SECRET || ""
      if (appUrl) {
        const callback = `${appUrl}/api/abandoned/check?txid=${encodeURIComponent(String(txid))}&secret=${encodeURIComponent(secret)}`
        await scheduleDelayedCall(callback, ABANDONED_DELAY_MIN * 60)
      }
    }
  } catch (e) {
    console.error("[PIX API] Falha ao salvar snapshot / agendar abandono:", e)
  }
}

// Status que a Pagou.ai considera como "pago"/liquidado.
// NÃO inclui "authorized": em cartão isso é só pré-autorização (limite reservado),
// não liquidado — confirmar nesse estado libera entrega sem dinheiro na conta.
function isPaidStatus(status: unknown) {
  return ["paid", "captured", "succeeded", "completed", "approved", "pago"].includes(
    String(status ?? "").toLowerCase()
  )
}

function getClientIp(request: Request) {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]?.trim() || "unknown"
  return request.headers.get("x-real-ip") || "unknown"
}

const isPrivateIp = (value: string) =>
  !value ||
  value === "unknown" ||
  value === "127.0.0.1" ||
  value === "::1" ||
  value === "0.0.0.0" ||
  value.startsWith("192.168.") ||
  value.startsWith("10.") ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(value)

function collectErrors(input: any): string[] {
  if (!input) return []
  if (typeof input === "string") return [input]
  if (Array.isArray(input)) return input.flatMap(collectErrors)
  if (typeof input === "object") {
    const parts: string[] = []
    if (input.message) parts.push(String(input.message))
    if (input.detail) parts.push(String(input.detail))
    if (input.error && typeof input.error === "string") parts.push(input.error)
    if (input.field && input.message) parts.push(`${input.field}: ${input.message}`)
    return parts.length ? parts : [JSON.stringify(input)]
  }
  return [String(input)]
}

export async function POST(request: Request) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { value, phone, email, name, cpf, title } = body ?? {}

  if (!value || value <= 0) {
    return NextResponse.json({ error: "Valor da transação inválido." }, { status: 400 })
  }
  if (!name || name.trim() === "") {
    return NextResponse.json({ error: "O Nome é obrigatório." }, { status: 400 })
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 })
  }

  const phoneDigits = (phone || "").replace(/\D/g, "")
  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    return NextResponse.json({ error: "Telefone deve ter 10 ou 11 dígitos (com DDD)." }, { status: 400 })
  }

  const cpfDigits = (cpf || "").replace(/\D/g, "")
  if (cpfDigits.length !== 11) {
    return NextResponse.json({ error: "CPF inválido. Deve conter 11 dígitos." }, { status: 400 })
  }

  const amountCents = Math.round(Number(value) * 100)
  const order = body?.order

  // Em local/dev caímos num IP público BR (os gateways exigem IP do comprador).
  const ip = getClientIp(request)
  const buyerIp = isPrivateIp(ip) ? "177.71.248.55" : ip

  // ── Multi-gateway: se o admin escolheu MedusaPay, processa o PIX por lá. ──
  const activeGateway = await getActiveGateway()
  if (activeGateway === "medusa") {
    if (!medusaConfigured()) {
      console.error("[PIX API] MEDUSAPAY_SECRET_KEY ausente no ambiente.")
      return NextResponse.json({ error: "Erro interno: MedusaPay não configurada." }, { status: 500 })
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")
    const wsecret = process.env.PAGOUAI_WEBHOOK_SECRET || ""
    const postbackUrl = appUrl
      ? `${appUrl}/api/webhook/medusa${wsecret ? `?secret=${encodeURIComponent(wsecret)}` : ""}`
      : undefined

    const result = await createPixMedusa({
      amountCents,
      name: name.trim(),
      email: email.trim(),
      cpfDigits,
      phoneDigits,
      ip: buyerIp,
      title: title || "Pedido CompadreFood",
      postbackUrl,
    })

    if (!result.ok) {
      console.error(`[PIX/Medusa] Erro (${result.status}):`, result.error)
      if (result.status === 401) {
        return NextResponse.json({ error: "Chave de autenticação inválida na MedusaPay." }, { status: 401 })
      }
      return NextResponse.json({ error: result.error || "Falha na MedusaPay.", gateway: result.raw }, { status: 502 })
    }
    if (!result.qrCode) {
      console.error("[PIX/Medusa] Sucesso, mas sem QR Code:", JSON.stringify(result.raw))
      return NextResponse.json({ error: "MedusaPay não retornou QR Code PIX válido." }, { status: 502 })
    }

    const txid = result.txid ?? null
    await persistPixOrder(txid, order, Number(value), "medusa")

    return NextResponse.json({
      txid,
      qrCode: result.qrCode,
      qrCodeImage: result.qrCodeImage ?? null,
      expiresAt: result.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: result.paymentStatus ?? "pending",
      paid: isPaidStatus(result.paymentStatus),
      amount: value,
      phone: phoneDigits,
    })
  }

  // ── CenturionPay (SEM relay: postback aponta direto pro webhook da loja) ──
  if (activeGateway === "centurion") {
    if (!centurionConfigured()) {
      console.error("[PIX API] CENTURION_API_KEY ausente no ambiente.")
      return NextResponse.json({ error: "Erro interno: CenturionPay não configurada." }, { status: 500 })
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")
    const wsecret = process.env.PAGOUAI_WEBHOOK_SECRET || ""
    const postbackUrl = appUrl
      ? `${appUrl}/api/webhook/centurion${wsecret ? `?secret=${encodeURIComponent(wsecret)}` : ""}`
      : undefined

    // Endereço do comprador (a doc da Centurion inclui customer.address / shipping).
    const a = order?.address
    const address =
      a && a.cep
        ? {
            cep: String(a.cep || ""),
            street: String(a.street || ""),
            number: String(a.number || ""),
            complement: a.complement ? String(a.complement) : undefined,
            neighborhood: String(a.neighborhood || ""),
            city: String(a.city || ""),
            stateUF: String(a.stateUF || ""),
          }
        : undefined

    const result = await createPixCenturion({
      amountCents,
      name: name.trim(),
      email: email.trim(),
      cpfDigits,
      phoneDigits,
      ip: buyerIp,
      title: title || "Pedido CumpadiFood",
      postbackUrl,
      address,
    })

    if (!result.ok) {
      console.error(`[PIX/Centurion] Erro (${result.status}):`, result.error)
      if (result.status === 401) {
        return NextResponse.json({ error: "Chave de autenticação inválida na CenturionPay." }, { status: 401 })
      }
      return NextResponse.json({ error: result.error || "Falha na CenturionPay.", gateway: result.raw }, { status: 502 })
    }
    if (!result.qrCode) {
      console.error("[PIX/Centurion] Sucesso, mas sem QR Code:", JSON.stringify(result.raw))
      return NextResponse.json({ error: "CenturionPay não retornou QR Code PIX válido." }, { status: 502 })
    }

    const txid = result.txid ?? null
    await persistPixOrder(txid, order, Number(value), "centurion")

    return NextResponse.json({
      txid,
      qrCode: result.qrCode,
      qrCodeImage: result.qrCodeImage ?? null,
      expiresAt: result.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: result.paymentStatus ?? "pending",
      paid: isPaidStatus(result.paymentStatus),
      amount: value,
      phone: phoneDigits,
    })
  }

  // ── Pagou.ai (gateway padrão) ──
  const rawKey = process.env.PAGOUAI_SECRET_KEY
  if (!rawKey) {
    console.error("[PIX API] Chave PAGOUAI_SECRET_KEY ausente no ambiente.")
    return NextResponse.json({ error: "Erro interno: Gateway não configurado." }, { status: 500 })
  }

  const secretKey = rawKey.trim().replace(/^Bearer\s+/i, "")
  const endpoint = "https://api.pagou.ai/v2/transactions"
  const externalRef = `order_${Date.now()}_${cpfDigits.slice(0, 4)}`
  const notifyUrl = getPaymentNotifyUrl(request)

  const payload: Record<string, any> = {
    external_ref: externalRef,
    amount: amountCents,
    currency: "BRL",
    method: "pix",
    notify_url: notifyUrl,
    ip_address: buyerIp,
    buyer: {
      name: name.trim(),
      email: email.trim(),
      phone: phoneDigits,
      ip_address: buyerIp,
      document: { number: cpfDigits, type: "CPF" },
    },
    products: [
      {
        name: title || "Pedido combo escolhido",
        quantity: 1,
        price: amountCents,
      },
    ],
  }

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secretKey}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const raw = await upstream.text()
    let data: any = null
    try {
      data = raw ? JSON.parse(raw) : null
    } catch {
      data = null
    }

    if (!upstream.ok) {
      const errorParts = [
        ...collectErrors(data?.errors),
        ...collectErrors(data?.validation_errors),
        ...collectErrors(data?.error),
        ...collectErrors(data?.detail),
        ...collectErrors(data?.message),
      ].filter(Boolean)
      const detail = errorParts.length ? errorParts.join(" | ") : raw || "Erro desconhecido no gateway"
      console.error(`[PIX API] Erro (${upstream.status}):`, raw)

      if (upstream.status === 401) {
        return NextResponse.json({ error: "Chave de autenticação inválida na Pagou.ai." }, { status: 401 })
      }
      return NextResponse.json({ error: detail, gateway: data ?? raw }, { status: 502 })
    }

    const transaction = data?.data ?? data ?? {}
    const pix = transaction?.pix ?? {}
    const qrCode = pix.qr_code ?? pix.qrcode ?? pix.qrCode ?? ""
    const qrCodeImage = pix.url ?? null

    if (!qrCode) {
      console.error("[PIX API] Resposta de sucesso, mas sem QR Code:", raw)
      return NextResponse.json({ error: "Gateway não retornou QR Code PIX válido." }, { status: 502 })
    }

    const expiresAt = pix.expiration_date ?? new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const txid = transaction?.id ?? data?.id ?? data?.transactionId ?? null

    // Persiste o pedido no KV pro webhook mandar o e-mail mesmo se a aba fechar.
    await persistPixOrder(txid ? String(txid) : null, order, Number(value), "pagou")

    return NextResponse.json({
      txid,
      qrCode,
      qrCodeImage,
      expiresAt,
      status: transaction?.status ?? "pending",
      paid: isPaidStatus(transaction?.status),
      amount: value,
      phone: phoneDigits,
    })
  } catch (err) {
    console.error("[PIX API] Falha na rede/comunicação:", err)
    return NextResponse.json({ error: "Falha de comunicação com o servidor de pagamento." }, { status: 502 })
  }
}
