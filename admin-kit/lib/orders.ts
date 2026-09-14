// Persistência e leitura de pedidos pro painel admin.
//
// CONTRATO COM A LOJA: o checkout da loja deve, ao gerar o pagamento, chamar
// `saveOrderSnapshot(txid, order, Date.now())`; e ao confirmar o pagamento
// (no front via polling OU num webhook do gateway) chamar `markOrderPaid(txid)`.
// O painel só LÊ daqui — ele não cria pedido. Tudo degrada gracioso sem KV.

import { kvConfigured, kvGetJSON, kvSetJSON, kvZAdd, kvZRevRange } from "./kv"

export { kvConfigured }

// ----------------------------------------------------------------------------
//  Tipos — autocontidos de propósito (não dependem do template de e-mail).
//  Ajuste os campos pra bater com o que a SUA loja já carrega no checkout.
// ----------------------------------------------------------------------------
export type OrderItem = {
  name: string
  quantity: number
  price?: number
}

export type OrderAddress = {
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  stateUF?: string
}

export type OrderCustomer = {
  name?: string
  email?: string
  phone?: string
}

// O que a loja grava no KV ao criar o pagamento.
export type OrderSnapshot = {
  customer?: OrderCustomer
  address?: OrderAddress
  items?: OrderItem[]
  total: number
  // Gateway que processou (opcional, livre): "pagou", "stripe", "mercadopago"…
  gateway?: string
}

export type StoredOrder = OrderSnapshot & {
  txid: string
  createdAt?: string
  proofUrl?: string
}

// O que o painel exibe — pedido + status calculado.
export type AdminOrder = StoredOrder & {
  status: "pago" | "aguardando" | "abandonado"
}

// 3 dias entre criar o pagamento e a confirmação/reprocessamento.
const ORDER_TTL_SECONDS = 60 * 60 * 24 * 3
// Sem pagar por esse tempo (min) = consideramos abandonado.
const ABANDONED_AFTER_MIN = 30

const orderKey = (txid: string) => `order:${txid}`
const paidKey = (txid: string) => `paid:${txid}`
const ORDERS_INDEX = "orders:index"

// --- Escrita (chamada pela LOJA, não pelo painel) --------------------------

export async function saveOrderSnapshot(txid: string, order: OrderSnapshot, createdAtMs: number): Promise<void> {
  if (!kvConfigured()) return
  const stored: StoredOrder = { ...order, txid, createdAt: new Date(createdAtMs).toISOString() }
  await kvSetJSON(orderKey(txid), stored, ORDER_TTL_SECONDS)
  // Indexa por data pro painel listar os mais recentes primeiro.
  await kvZAdd(ORDERS_INDEX, createdAtMs, txid)
}

export async function setOrderProofUrl(txid: string, proofUrl: string): Promise<void> {
  if (!kvConfigured()) return
  const order = await kvGetJSON<StoredOrder>(orderKey(txid))
  if (!order) return
  order.proofUrl = proofUrl
  await kvSetJSON(orderKey(txid), order, ORDER_TTL_SECONDS)
}

export async function markOrderPaid(txid: string): Promise<void> {
  if (!kvConfigured()) return
  await kvSetJSON(paidKey(txid), 1, ORDER_TTL_SECONDS)
}

export async function isOrderPaid(txid: string): Promise<boolean> {
  if (!kvConfigured()) return false
  return (await kvGetJSON(paidKey(txid))) != null
}

// --- Leitura (chamada pelo PAINEL) -----------------------------------------

export async function listRecentOrders(limit = 100): Promise<AdminOrder[]> {
  if (!kvConfigured()) return []
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
    out.push({ ...order, txid, status })
  }
  return out
}
