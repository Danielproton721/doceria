// Cliente Redis (Upstash REST) sem dependência externa — fala direto com a REST
// API via fetch. Se UPSTASH_REDIS_REST_URL/TOKEN não estiverem configurados,
// kvConfigured() = false e o painel degrada gracioso (sem dados, sem erro).
//
// Aceita os dois padrões de nome: o do Upstash (UPSTASH_REDIS_REST_*) e o que a
// integração de Storage da Vercel costuma injetar (KV_REST_API_*).

const REST_URL = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)?.replace(/\/$/, "")
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

// Prefixo opcional aplicado a TODAS as chaves. Permite que duas lojas dividam a
// MESMA instância Upstash sem misturar dados: cada loja define seu KV_PREFIX
// (ex.: "cumpadi:"). Sem a var, o prefixo é "" e o comportamento é idêntico.
const KEY_PREFIX = process.env.KV_PREFIX || ""
const pk = (key: string) => `${KEY_PREFIX}${key}`

export function kvConfigured(): boolean {
  return Boolean(REST_URL && REST_TOKEN)
}

// Executa um comando Redis no formato de array (["SET", key, value, ...]).
async function command(args: (string | number)[]): Promise<unknown> {
  if (!REST_URL || !REST_TOKEN) throw new Error("KV (Upstash) não configurado.")
  const res = await fetch(REST_URL, {
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
    throw new Error(`KV erro ${res.status}: ${data?.error ?? JSON.stringify(data)}`)
  }
  return data?.result ?? null
}

export async function kvSetJSON(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  if (ttlSeconds && ttlSeconds > 0) {
    await command(["SET", pk(key), JSON.stringify(value), "EX", ttlSeconds])
  } else {
    await command(["SET", pk(key), JSON.stringify(value)])
  }
}

export async function kvGetJSON<T = unknown>(key: string): Promise<T | null> {
  const raw = (await command(["GET", pk(key)])) as string | null
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function kvDel(key: string): Promise<void> {
  await command(["DEL", pk(key)])
}

// Lock distribuído: retorna true só pra QUEM conseguiu criar a chave (SET NX).
export async function kvClaimOnce(key: string, ttlSeconds: number): Promise<boolean> {
  const result = await command(["SET", pk(key), "1", "NX", "EX", ttlSeconds])
  return result === "OK"
}

// Sorted set: adiciona/atualiza um membro com score (indexa pedidos por data).
// Só a CHAVE é prefixada; o member (ex.: txid) fica intacto pois é reusado como dado.
export async function kvZAdd(key: string, score: number, member: string): Promise<void> {
  await command(["ZADD", pk(key), score, member])
}

// Sorted set: membros em ordem decrescente de score (mais recentes primeiro).
export async function kvZRevRange(key: string, start: number, stop: number): Promise<string[]> {
  const res = await command(["ZREVRANGE", pk(key), start, stop])
  return Array.isArray(res) ? res.map(String) : []
}

// Sorted set: remove membros com score no intervalo [min, max] (expira presença).
export async function kvZRemRangeByScore(key: string, min: number, max: number): Promise<number> {
  const res = await command(["ZREMRANGEBYSCORE", pk(key), min, max])
  return typeof res === "number" ? res : Number(res) || 0
}

// Sorted set: quantidade de membros (conta quem está online agora).
export async function kvZCard(key: string): Promise<number> {
  const res = await command(["ZCARD", pk(key)])
  return typeof res === "number" ? res : Number(res) || 0
}
