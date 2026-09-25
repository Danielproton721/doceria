import { NextResponse } from "next/server"

import { isAuthed } from "@/lib/admin-auth"
import { kvClaimOnce, kvDel, kvGetJSON, kvSetJSON } from "@/lib/kv"
import {
  MANUAL_CTA_DESCONTO,
  MANUAL_CTA_HREF,
  MIN_PRODUTOS_DESCONTO,
  OFERTA_DESCONTO,
  abandonManualKey,
  abandonManualLockKey,
  abandonSentKey,
  confirmacaoAutoKey,
  isTipoEmailManual,
  pagoManualKey,
  pagoManualLockKey,
  reativacaoManualKey,
  reativacaoManualLockKey,
} from "@/lib/manual-email"
import { getOrderSnapshot, isOrderPaid, type StoredOrder } from "@/lib/order-store"
import {
  sendAbandonedCartEmail,
  sendOrderEmail,
  sendReengagementEmail,
  validateOrderInput,
} from "@/lib/send-order-email"

export const dynamic = "force-dynamic"

const LOCK_TTL_SECONDS = 60
const REGISTRO_TTL_SECONDS = 60 * 60 * 24 * 90

const erro = (status: number, error: string, extra?: Record<string, unknown>) =>
  NextResponse.json({ ok: false, error, ...extra }, { status })

export async function POST(request: Request) {
  if (!(await isAuthed())) return erro(401, "Não autorizado.")

  let body: any
  try {
    body = await request.json()
  } catch {
    return erro(400, "JSON inválido.")
  }

  const txid = typeof body?.txid === "string" ? body.txid.trim() : ""
  if (!txid || txid.length > 200) return erro(400, "txid obrigatório.")
  if (!isTipoEmailManual(body?.tipo)) return erro(400, "Tipo de e-mail inválido.")
  const confirmarReenvio = body?.confirmarReenvio === true

  const order = await getOrderSnapshot(txid)
  if (!order) return erro(404, "Pedido não encontrado — pode ter expirado (fica guardado por 3 dias).")

  const invalido = validateOrderInput(order)
  if (invalido) return erro(422, invalido)

  const pago = await isOrderPaid(txid)
  if (body.tipo === "pago") {
    if (!pago) return erro(409, "Pagamento ainda não confirmado — use o e-mail de pedido pendente.")
    return enviarPagamentoConfirmado(txid, order, confirmarReenvio)
  }

  if (pago) return erro(409, "Pedido já pago — use o e-mail de pagamento confirmado.")

  if (body.tipo === "reativacao") return enviarReativacao(txid, order, confirmarReenvio)

  const comDesconto = body.tipo === "pendente-desconto"
  if (comDesconto && (order.items?.length ?? 0) < MIN_PRODUTOS_DESCONTO) {
    return erro(422, `O desconto só vale para pedido com ${MIN_PRODUTOS_DESCONTO} produtos diferentes.`)
  }
  return enviarPedidoPendente(txid, order, confirmarReenvio, comDesconto)
}

// Pendente: mesmo e-mail do automático (com ou sem cupom). Divide a trava com o
// disparo automático do QStash, pra ninguém receber duas vezes.
async function enviarPedidoPendente(
  txid: string,
  order: StoredOrder,
  confirmarReenvio: boolean,
  comDesconto: boolean,
) {
  const [automatico, manualEm] = await Promise.all([
    kvGetJSON<unknown>(abandonSentKey(txid)),
    kvGetJSON<string>(abandonManualKey(txid)),
  ])
  if ((automatico || manualEm) && !confirmarReenvio) {
    return erro(409, "Esse cliente já recebeu este e-mail.", {
      jaEnviado: { automatico: Boolean(automatico) && !manualEm, manualEm: manualEm || null },
    })
  }

  if (!(await kvClaimOnce(abandonManualLockKey(txid), LOCK_TTL_SECONDS))) {
    return erro(429, "Já tem um envio em andamento pra esse pedido. Aguarde um minuto e tente de novo.")
  }

  const resultado = comDesconto
    ? await sendAbandonedCartEmail(order, { ctaHref: MANUAL_CTA_DESCONTO, oferta: OFERTA_DESCONTO })
    : await sendAbandonedCartEmail(order, { ctaHref: MANUAL_CTA_HREF })
  if (!resultado.ok) {
    await kvDel(abandonManualLockKey(txid)).catch(() => {})
    return erro(resultado.status, resultado.error)
  }

  const enviadoEm = new Date().toISOString()
  try {
    await kvSetJSON(abandonManualKey(txid), enviadoEm, REGISTRO_TTL_SECONDS)
    // Segura o automático, caso ele ainda não tenha rodado.
    await kvClaimOnce(abandonSentKey(txid), REGISTRO_TTL_SECONDS)
  } catch (e) {
    console.error("[EMAIL MANUAL] enviado, mas falhou ao registrar no banco:", txid, e)
  }

  return NextResponse.json({ ok: true, enviadoEm })
}

// Lead frio: sem cobrança, botão pra loja. Trava própria — quase sempre o
// cliente já recebeu o e-mail de pendente antes deste.
async function enviarReativacao(txid: string, order: StoredOrder, confirmarReenvio: boolean) {
  const jaEm = await kvGetJSON<string>(reativacaoManualKey(txid))
  if (jaEm && !confirmarReenvio) {
    return erro(409, "Esse cliente já recebeu este e-mail.", {
      jaEnviado: { automatico: false, manualEm: jaEm },
    })
  }

  if (!(await kvClaimOnce(reativacaoManualLockKey(txid), LOCK_TTL_SECONDS))) {
    return erro(429, "Já tem um envio em andamento pra esse pedido. Aguarde um minuto e tente de novo.")
  }

  const resultado = await sendReengagementEmail(order, { ctaHref: MANUAL_CTA_HREF })
  if (!resultado.ok) {
    await kvDel(reativacaoManualLockKey(txid)).catch(() => {})
    return erro(resultado.status, resultado.error)
  }

  const enviadoEm = new Date().toISOString()
  try {
    await kvSetJSON(reativacaoManualKey(txid), enviadoEm, REGISTRO_TTL_SECONDS)
  } catch (e) {
    console.error("[EMAIL MANUAL] reativação enviada, mas falhou ao registrar:", txid, e)
  }

  return NextResponse.json({ ok: true, enviadoEm })
}

// Mesmo template do e-mail automático de confirmação — aqui a intenção é
// justamente mandar de novo.
async function enviarPagamentoConfirmado(txid: string, order: StoredOrder, confirmarReenvio: boolean) {
  const [automatico, manualEm] = await Promise.all([
    kvGetJSON<unknown>(confirmacaoAutoKey(txid)),
    kvGetJSON<string>(pagoManualKey(txid)),
  ])
  if ((automatico || manualEm) && !confirmarReenvio) {
    return erro(409, "Esse cliente já recebeu este e-mail.", {
      jaEnviado: { automatico: Boolean(automatico), automaticoEm: null, manualEm: manualEm || null },
    })
  }

  if (!(await kvClaimOnce(pagoManualLockKey(txid), LOCK_TTL_SECONDS))) {
    return erro(429, "Já tem um envio em andamento pra esse pedido. Aguarde um minuto e tente de novo.")
  }

  const resultado = await sendOrderEmail(order)
  if (!resultado.ok) {
    await kvDel(pagoManualLockKey(txid)).catch(() => {})
    return erro(resultado.status, resultado.error)
  }

  const enviadoEm = new Date().toISOString()
  try {
    await kvSetJSON(pagoManualKey(txid), enviadoEm, REGISTRO_TTL_SECONDS)
  } catch (e) {
    console.error("[EMAIL MANUAL] confirmação reenviada, mas falhou ao registrar:", txid, e)
  }

  return NextResponse.json({ ok: true, enviadoEm })
}
