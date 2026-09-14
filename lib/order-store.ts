// Persistência do pedido pro fluxo webhook: guardamos o snapshot completo no KV
// na criação do PIX (chave = txid), e o webhook da Pagou.ai lê de volta quando o
// pagamento confirma — assim o e-mail sai mesmo se o cliente fechar a aba.

import { kvClaimOnce, kvConfigured, kvDel, kvGetJSON, kvSetJSON, kvZAdd, kvZRevRange } from "./kv"
import { getTxGateway, type GatewayId } from "@/lib/gateways/active"
import type { OrderEmailInput } from "./order-email"

export { kvConfigured }

// Pedido como guardado no KV: o snapshot do e-mail + metadados pro admin.
export type StoredOrder = OrderEmailInput & {
  txid?: string
  createdAt?: string
  proofUrl?: string
}

export type AdminOrder = StoredOrder & {
  txid: string
  status: "pago" | "aguardando" | "abandonado"
  gateway: GatewayId
}

// 3 dias de folga entre criar o PIX e a confirmação/reprocessamento do webhook.
const ORDER_TTL_SECONDS = 60 * 60 * 24 * 3
// Janela sem pagamento a partir da qual consideramos o pedido abandonado (min).
const ABANDONED_AFTER_MIN = 30

const orderKey = (txid: string) => `order:${txid}`
const emailLockKey = (txid: string) => `order-email:${txid}`
const abandonLockKey = (txid: string) => `abandon-sent:${txid}`
const paidKey = (txid: string) => `paid:${txid}`
const ORDERS_INDEX = "orders:index"

// Gera um código de pedido no mesmo formato do front (XX000000000XX). Usado só
// quando é o webhook que dispara o e-mail (aba fechada) — o cliente vê só o e-mail.
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"
function randomLetters(count: number): string {
  let out = ""
  for (let i = 0; i < count; i += 1) {
    out += LETTERS[Math.floor(Math.random() * LETTERS.length)]
  }
  return out
}
export function generateOrderCode(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = Math.imul(31, hash) + seed.charCodeAt(i)
    hash |= 0
  }
  const number = String(Math.abs(hash + Date.now()) % 1000000000).padStart(9, "0")
  return `${randomLetters(2)}${number}${randomLetters(2)}`
}

export async function saveOrderSnapshot(txid: string, order: OrderEmailInput, createdAtMs: number): Promise<void> {
  const stored: StoredOrder = { ...order, txid, createdAt: new Date(createdAtMs).toISOString() }
  await kvSetJSON(orderKey(txid), stored, ORDER_TTL_SECONDS)
  // Indexa por data pro painel admin listar os mais recentes primeiro.
  await kvZAdd(ORDERS_INDEX, createdAtMs, txid)
}

export async function getOrderSnapshot(txid: string): Promise<StoredOrder | null> {
  return kvGetJSON<StoredOrder>(orderKey(txid))
}

// Salva a URL do comprovante (Vercel Blob) no pedido, preservando o resto.
export async function setOrderProofUrl(txid: string, proofUrl: string): Promise<void> {
  const order = await kvGetJSON<StoredOrder>(orderKey(txid))
  if (!order) return
  order.proofUrl = proofUrl
  await kvSetJSON(orderKey(txid), order, ORDER_TTL_SECONDS)
}

// Lista os pedidos mais recentes pro painel admin, já com o status calculado.
export async function listRecentOrders(limit = 100): Promise<AdminOrder[]> {
  const txids = await kvZRevRange(ORDERS_INDEX, 0, limit - 1)
  const out: AdminOrder[] = []
  for (const txid of txids) {
    const order = await kvGetJSON<StoredOrder>(orderKey(txid))
    if (!order) continue
    const paid = await isOrderPaid(txid)
    let status: AdminOrder["status"]
    if (paid) {
      status = "pago"
    } else {
      const createdMs = order.createdAt ? Date.parse(order.createdAt) : 0
      const ageMin = createdMs ? (Date.now() - createdMs) / 60000 : Infinity
      status = ageMin >= ABANDONED_AFTER_MIN ? "abandonado" : "aguardando"
    }
    // Gateway que processou: pedidos antigos (pré-multi-gateway) eram todos Pagou.ai.
    const gateway = (await getTxGateway(txid)) ?? "pagou"
    out.push({ ...order, txid, status, gateway })
  }
  return out
}

// true = você ganhou o direito de enviar o e-mail desse pedido.
// false = já foi reservado/enviado por outro caminho (front ou webhook).
export async function claimOrderEmail(txid: string): Promise<boolean> {
  return kvClaimOnce(emailLockKey(txid), ORDER_TTL_SECONDS)
}

// Libera a trava caso o envio falhe, pra um retry (webhook ou front) tentar de novo.
export async function releaseOrderEmail(txid: string): Promise<void> {
  await kvDel(emailLockKey(txid))
}

// Marca o pedido como pago (flag independente do envio do e-mail). Chamado no
// webhook e na rota de e-mail, ambos disparados só após pagamento confirmado.
export async function markOrderPaid(txid: string): Promise<void> {
  await kvSetJSON(paidKey(txid), 1, ORDER_TTL_SECONDS)
}

// true se o pedido foi pago. Usado pelo check de abandono pra NÃO incomodar
// quem já pagou.
export async function isOrderPaid(txid: string): Promise<boolean> {
  return (await kvGetJSON(paidKey(txid))) != null
}

// Trava do e-mail de abandono: garante envio único por pedido.
export async function claimAbandonEmail(txid: string): Promise<boolean> {
  return kvClaimOnce(abandonLockKey(txid), ORDER_TTL_SECONDS)
}
