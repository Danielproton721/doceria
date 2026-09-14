// Agendamento de chamadas com atraso via QStash (Upstash). Usado pra disparar o
// e-mail de carrinho abandonado X minutos depois da criação do PIX, mesmo que o
// cliente feche a aba. Sem QSTASH_TOKEN configurado, vira no-op seguro.

const QSTASH_TOKEN = process.env.QSTASH_TOKEN
// Base do QStash. Varia por região (ex.: https://qstash-us-east-1.upstash.io).
// Default no endpoint global/EU se a env não for informada.
const QSTASH_BASE = (process.env.QSTASH_URL || "https://qstash.upstash.io").replace(/\/$/, "")

export function qstashConfigured(): boolean {
  return Boolean(QSTASH_TOKEN)
}

// Agenda um POST para `destinationUrl` daqui a `delaySeconds` segundos.
export async function scheduleDelayedCall(destinationUrl: string, delaySeconds: number): Promise<void> {
  if (!QSTASH_TOKEN) return
  const res = await fetch(`${QSTASH_BASE}/v2/publish/${destinationUrl}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${QSTASH_TOKEN}`,
      "content-type": "application/json",
      "upstash-delay": `${delaySeconds}s`,
    },
    body: JSON.stringify({ scheduled: true }),
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`QStash erro ${res.status}: ${await res.text()}`)
  }
}
