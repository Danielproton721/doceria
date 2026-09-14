import { NextResponse } from "next/server"
import { countOnline, recordHeartbeat } from "@/lib/presence"

export const dynamic = "force-dynamic"

// Heartbeat do visitante: a loja chama isto periodicamente com um id de sessão.
export async function POST(request: Request) {
  let body: any
  try {
    body = await request.json()
  } catch {
    body = {}
  }
  const id = String(body?.id || "").slice(0, 64)
  if (!id) return NextResponse.json({ ok: false }, { status: 400 })

  try {
    await recordHeartbeat(id, Date.now())
  } catch {
    // best effort — presença nunca derruba a navegação
  }
  return NextResponse.json({ ok: true })
}

// Quantas pessoas online agora (usado pelo painel admin).
export async function GET() {
  try {
    const online = await countOnline(Date.now())
    return NextResponse.json({ online })
  } catch {
    return NextResponse.json({ online: 0 })
  }
}
