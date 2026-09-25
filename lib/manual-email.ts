import { kvConfigured, kvGetJSON } from "./kv"

// Tipos de disparo manual pelo painel:
//   "abandonado"        = pedido pendente (não pago), sem desconto
//   "pendente-desconto" = o mesmo, com cupom pra destravar a compra
//   "reativacao"        = lead frio (sumiu faz dias), sem cobrança
//   "pago"              = reenvia a notinha do pagamento confirmado
export const TIPOS_EMAIL_MANUAL = ["abandonado", "pendente-desconto", "reativacao", "pago"] as const
export type TipoEmailManual = (typeof TIPOS_EMAIL_MANUAL)[number]

export function isTipoEmailManual(v: unknown): v is TipoEmailManual {
  return typeof v === "string" && (TIPOS_EMAIL_MANUAL as readonly string[]).includes(v)
}

// Não aponta pro /checkout: o carrinho vive no navegador do cliente e abriria vazio.
export const MANUAL_CTA_HREF = "/"
// Cupom de primeira compra da loja (o mesmo de lib/cart-context).
export const CUPOM_DESCONTO = "PRIMEIRA"
export const CUPOM_DESCONTO_PCT = 10
export const OFERTA_DESCONTO = { pct: CUPOM_DESCONTO_PCT, cupom: CUPOM_DESCONTO }
// Link que já aplica o cupom no carrinho (lido em lib/cart-context).
export const MANUAL_CTA_DESCONTO = `/?cupom=${CUPOM_DESCONTO}`
// O desconto só faz sentido em pedido com mais de um produto.
export const MIN_PRODUTOS_DESCONTO = 2

// MESMA chave que o e-mail automático de abandonado usa (order-store), pra um
// não duplicar o outro.
export const abandonSentKey = (txid: string) => `abandon-sent:${txid}`
export const abandonManualKey = (txid: string) => `email:manual:abandonado:${txid}`
export const abandonManualLockKey = (txid: string) => `email:lock:abandonado:${txid}`

// Trava do e-mail automático de confirmação (order-store).
export const confirmacaoAutoKey = (txid: string) => `order-email:${txid}`
export const pagoManualKey = (txid: string) => `email:manual:pago:${txid}`
export const pagoManualLockKey = (txid: string) => `email:lock:pago:${txid}`

// A reativação sai DEPOIS do e-mail de pendente, então tem trava própria.
export const reativacaoManualKey = (txid: string) => `email:manual:reativacao:${txid}`
export const reativacaoManualLockKey = (txid: string) => `email:lock:reativacao:${txid}`

async function lerData(key: string): Promise<string | null> {
  if (!kvConfigured()) return null
  try {
    const v = await kvGetJSON<string>(key)
    return v && !Number.isNaN(Date.parse(v)) ? v : null
  } catch {
    return null
  }
}

/** Último disparo manual em pedido não pago (pendente ou reativação). */
export async function getEmailManualEm(txid: string): Promise<string | null> {
  const datas = (await Promise.all([lerData(abandonManualKey(txid)), lerData(reativacaoManualKey(txid))]))
    .filter((d): d is string => Boolean(d))
    .sort()
  return datas.length ? datas[datas.length - 1] : null
}

/** Disparos do e-mail de pagamento confirmado: o automático e o manual. */
export async function getEmailsPagoEm(txid: string): Promise<{ automaticoEm: string | null; manualEm: string | null }> {
  const [automaticoEm, manualEm] = await Promise.all([lerData(confirmacaoAutoKey(txid)), lerData(pagoManualKey(txid))])
  return { automaticoEm, manualEm }
}
