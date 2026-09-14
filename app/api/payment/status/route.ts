import { NextResponse } from "next/server"
import { isOrderPaid, kvConfigured } from "@/lib/order-store"
import { getTxGateway } from "@/lib/gateways/active"
import { getStatusMedusa } from "@/lib/gateways/medusa"
import { getStatusCenturion } from "@/lib/gateways/centurion"

export const dynamic = "force-dynamic"

// "authorized" fica de fora de propósito: é pré-autorização de cartão (não liquidado).
function isPaidStatus(status: unknown) {
  return ["paid", "captured", "succeeded", "completed", "approved", "pago"].includes(
    String(status ?? "").toLowerCase()
  )
}

// Sem KV/webhook: consultamos o status direto na Pagou.ai a cada polling.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const txid = url.searchParams.get("txid")?.trim()

  if (!txid) {
    return NextResponse.json({ error: "txid obrigatorio." }, { status: 400 })
  }

  // Atalho rápido: se o webhook já marcou pago no KV, confirma na hora — sem
  // depender da consulta ao gateway, que demora a refletir o pagamento.
  // Vale pros dois gateways (o webhook seta a flag paid:{txid}).
  if (kvConfigured()) {
    try {
      if (await isOrderPaid(txid)) {
        return NextResponse.json({ txid, paid: true, status: "paid", source: "kv" })
      }
    } catch {
      // KV indisponível: segue pra consulta direta no gateway.
    }
  }

  // Descobre qual gateway criou essa transação (default Pagou.ai).
  if (kvConfigured()) {
    try {
      const gw = await getTxGateway(txid)
      if (gw === "medusa") {
        const r = await getStatusMedusa(txid)
        return NextResponse.json({ txid, paid: r.ok ? r.paid : false, status: r.ok ? r.status : "pending" })
      }
      if (gw === "centurion") {
        const r = await getStatusCenturion(txid)
        return NextResponse.json({ txid, paid: r.ok ? r.paid : false, status: r.ok ? r.status : "pending" })
      }
    } catch {
      // segue pra consulta na Pagou
    }
  }

  const rawKey = process.env.PAGOUAI_SECRET_KEY
  if (!rawKey) {
    return NextResponse.json({ error: "Gateway não configurado." }, { status: 500 })
  }
  const secretKey = rawKey.trim().replace(/^Bearer\s+/i, "")

  try {
    const upstream = await fetch(`https://api.pagou.ai/v2/transactions/${encodeURIComponent(txid)}`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${secretKey}`,
        accept: "application/json",
      },
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
      console.error(`[STATUS API] Erro (${upstream.status}):`, raw)
      // Não trava o polling do front: devolve "pending" em vez de erro fatal.
      return NextResponse.json({ txid, paid: false, status: "pending" })
    }

    const transaction = data?.data ?? data ?? {}
    const status = transaction?.status ?? "pending"

    return NextResponse.json({
      txid,
      paid: isPaidStatus(status),
      status,
      updatedAt: transaction?.updated_at ?? transaction?.paid_at ?? null,
    })
  } catch (err) {
    console.error("[STATUS API] Falha de comunicação:", err)
    return NextResponse.json({ txid, paid: false, status: "pending" })
  }
}
