// Cliente KV DEDICADO ao contador de presença (online).
//
// Permite apontar SÓ o contador pra um servidor Upstash separado — os heartbeats
// (muitas escritas) saem do banco principal, que fica só com pedidos/catálogo.
//
// Se PRESENCE_KV_REST_URL / PRESENCE_KV_REST_TOKEN estiverem definidos, a presença
// usa esse servidor. Sem eles, cai no KV padrão (lib/kv.ts) — degrada gracioso,
// nada quebra. Compatível com Upstash Redis (REST API).

import {
  kvConfigured,
  kvZAdd,
  kvZCard,
  kvZRemRangeByScore,
  kvPfAdd,
  kvPfCount,
  kvPfCountUnion,
  kvExpire,
} from "./kv"

const REST_URL = process.env.PRESENCE_KV_REST_URL?.replace(/\/$/, "")
const REST_TOKEN = process.env.PRESENCE_KV_REST_TOKEN
const DEDICATED = Boolean(REST_URL && REST_TOKEN)

async function command(args: (string | number)[]): Promise<unknown> {
  const res = await fetch(REST_URL as string, {
    method: "POST",
    headers: {
      authorization: `Bearer ${REST_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(args),
    cache: "no-store",
  })
  const data = (await res.json().catch(() => null)) as { result?: unknown; error?: string } | null
  if (!res.ok) {
    throw new Error(`Presence KV erro ${res.status}: ${data?.error ?? JSON.stringify(data)}`)
  }
  return data?.result ?? null
}

// true se dá pra registrar/contar presença (servidor dedicado OU KV padrão).
export function presenceConfigured(): boolean {
  return DEDICATED || kvConfigured()
}

export async function presenceZAdd(key: string, score: number, member: string): Promise<void> {
  if (DEDICATED) {
    await command(["ZADD", key, score, member])
    return
  }
  await kvZAdd(key, score, member)
}

export async function presenceZCard(key: string): Promise<number> {
  if (DEDICATED) {
    const r = await command(["ZCARD", key])
    return typeof r === "number" ? r : Number(r) || 0
  }
  return kvZCard(key)
}

export async function presenceZRemRangeByScore(key: string, min: number, max: number): Promise<number> {
  if (DEDICATED) {
    const r = await command(["ZREMRANGEBYSCORE", key, min, max])
    return typeof r === "number" ? r : Number(r) || 0
  }
  return kvZRemRangeByScore(key, min, max)
}

// --- HyperLogLog (visitantes únicos por dia) --------------------------------
// Mesma regra dos demais: servidor dedicado se configurado, senão KV padrão.

export async function presencePfAdd(key: string, member: string): Promise<void> {
  if (DEDICATED) {
    await command(["PFADD", key, member])
    return
  }
  await kvPfAdd(key, member)
}

export async function presencePfCount(key: string): Promise<number> {
  if (DEDICATED) {
    const r = await command(["PFCOUNT", key])
    return typeof r === "number" ? r : Number(r) || 0
  }
  return kvPfCount(key)
}

// Únicos da UNIÃO de vários dias em 1 comando (pessoa repetida conta 1x).
export async function presencePfCountUnion(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0
  if (DEDICATED) {
    const r = await command(["PFCOUNT", ...keys])
    return typeof r === "number" ? r : Number(r) || 0
  }
  return kvPfCountUnion(keys)
}

export async function presenceExpire(key: string, seconds: number): Promise<void> {
  if (DEDICATED) {
    await command(["EXPIRE", key, seconds])
    return
  }
  await kvExpire(key, seconds)
}
