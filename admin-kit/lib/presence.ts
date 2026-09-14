// Presença "ao vivo": cada visitante manda um heartbeat com um id de sessão.
// Guardamos num sorted set (score = timestamp). "Online" = quem deu sinal nos
// últimos WINDOW_MS. Sem KV configurado, vira no-op (conta 0).

import { kvConfigured, kvZAdd, kvZCard, kvZRemRangeByScore } from "./kv"

const KEY = "presence:online"
// Janela de presença: considera online quem pingou nos últimos 60s.
const WINDOW_MS = 60_000

export async function recordHeartbeat(id: string, nowMs: number): Promise<void> {
  if (!kvConfigured() || !id) return
  await kvZAdd(KEY, nowMs, id)
  // Limpa quem ficou sem pingar (saiu da loja / fechou a aba).
  await kvZRemRangeByScore(KEY, 0, nowMs - WINDOW_MS)
}

export async function countOnline(nowMs: number): Promise<number> {
  if (!kvConfigured()) return 0
  await kvZRemRangeByScore(KEY, 0, nowMs - WINDOW_MS)
  return kvZCard(KEY)
}
