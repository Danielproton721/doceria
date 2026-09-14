// ============================================================================
// MODO COPA — config central (overlay verde-amarelo, liga/desliga por data)
// ----------------------------------------------------------------------------
// Ambush marketing: futebol/torcida + verde-amarelo, SEM marcas oficiais.
// A faixa/countdown aparece sozinha quando há jogo no radar e some após o
// último. Para desligar manualmente, deixe JOGOS_COPA = [] (ou COPA_FORCAR_OFF).
// Horários em Brasília (-03:00).
// ============================================================================

export interface JogoCopa {
  titulo: string
  /** ISO com fuso (-03:00 = Brasília). Usado para o countdown. */
  data: string
  /** Texto curto pra exibir (ex.: "sex 19/06 · 21h30"). */
  quando: string
  local?: string
}

// A Copa acabou — modo desligado de vez (banner, countdown, coleção "Esquenta",
// faixas e o anúncio do cupom COPA não aparecem mais, em qualquer data).
export const COPA_FORCAR_OFF = true

export const JOGOS_COPA: JogoCopa[] = [
  { titulo: "Brasil x Marrocos", data: "2026-06-13T19:00:00-03:00", quando: "sáb 13/06 · 19h", local: "Nova York" },
  { titulo: "Brasil x Haiti", data: "2026-06-19T21:30:00-03:00", quando: "sex 19/06 · 21h30", local: "Filadélfia" },
  { titulo: "Escócia x Brasil", data: "2026-06-24T19:00:00-03:00", quando: "qua 24/06 · 19h", local: "Miami" },
]

// Mantém o jogo como "atual" até 2h após o apito (cobre o tempo de jogo).
const JANELA_AO_VIVO_MS = 2 * 60 * 60 * 1000

/** Próximo jogo no radar (ou o que está rolando agora). Null se acabou tudo. */
export function proximoJogo(now: Date = new Date()): JogoCopa | null {
  if (COPA_FORCAR_OFF) return null
  const t = now.getTime()
  return (
    JOGOS_COPA
      .map((j) => ({ j, ts: new Date(j.data).getTime() }))
      .filter((x) => x.ts + JANELA_AO_VIVO_MS > t)
      .sort((a, b) => a.ts - b.ts)[0]?.j ?? null
  )
}

export function copaAtiva(now: Date = new Date()): boolean {
  return proximoJogo(now) !== null
}

// Coleção "Esquenta do Jogo": gelada + petisco + salgadinho pra ver o jogo.
export const ESQUENTA_IDS: string[] = [
  "24", // Amstel 473ml
  "211", // Frango a Passarinho
  "27", // Brahma Duplo Malte
  "200", // Batata c/ Queijo e Bacon
  "30", // Antarctica Original
  "501", // Torcida Pimenta Mexicana
  "204", // Coxinha de Frango
  "31", // Stella Artois
  "216", // Torresmo Pururuca
  "26", // Skol Beats
  "217", // Tulipas
  "503", // Torcida Bacon
]

/** É dia de jogo? (mesma data civil do próximo jogo) */
export function ehDiaDeJogo(now: Date = new Date()): boolean {
  const j = proximoJogo(now)
  if (!j) return false
  const d = new Date(j.data)
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}
