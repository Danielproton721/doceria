// Captura e leitura do gclid (Google Click ID) — o identificador do clique no
// anúncio do Google Ads. Guardado no localStorage quando a visita chega com
// ?gclid= na URL, e lido depois pra gravar no pedido (medição futura de
// conversão offline). NÃO dispara nada nem muda comportamento do site.

const GCLID_KEY = "cumpadi-gclid"
// Janela de conversão do Google (90 dias). Depois disso o gclid não credita mais.
const GCLID_TTL_MS = 90 * 24 * 60 * 60 * 1000

// Chame no carregamento das páginas de entrada. Se a URL tiver ?gclid=, guarda.
export function captureGclid(): void {
  if (typeof window === "undefined") return
  try {
    const g = new URLSearchParams(window.location.search).get("gclid")
    if (g && g.trim()) {
      window.localStorage.setItem(GCLID_KEY, JSON.stringify({ gclid: g.trim(), ts: Date.now() }))
    }
  } catch {
    // localStorage indisponível: ignora sem quebrar nada
  }
}

// Lê o gclid salvo (ou null). Descarta se passou da janela de 90 dias.
export function getGclid(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(GCLID_KEY)
    if (!raw) return null
    const d = JSON.parse(raw)
    if (d?.gclid && d?.ts && Date.now() - d.ts < GCLID_TTL_MS) return String(d.gclid)
    return null
  } catch {
    return null
  }
}
