import { NextResponse } from "next/server"
import { blobConfigured, uploadProof } from "@/lib/blob"
import { kvConfigured, setOrderProofUrl } from "@/lib/order-store"

export const dynamic = "force-dynamic"

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "application/pdf"]

// Recebe o comprovante (multipart) enviado pelo cliente no checkout, sobe pro
// Vercel Blob e guarda a URL no pedido. Endpoint público (cliente sobe), mas o
// txid é um UUID — só quem tem o código do pedido consegue anexar.
export async function POST(request: Request) {
  if (!blobConfigured() || !kvConfigured()) {
    return NextResponse.json({ ok: false, error: "Storage não configurado." })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ ok: false, error: "Envio inválido." }, { status: 400 })
  }

  const txid = String(form.get("txid") || "").trim()
  const file = form.get("file")
  if (!txid) return NextResponse.json({ ok: false, error: "txid ausente." }, { status: 400 })
  if (!(file instanceof Blob)) return NextResponse.json({ ok: false, error: "Arquivo ausente." }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, error: "Arquivo acima de 10 MB." }, { status: 400 })

  const type = file.type || "application/octet-stream"
  if (!ALLOWED.includes(type)) return NextResponse.json({ ok: false, error: "Tipo não permitido." }, { status: 400 })

  try {
    const ext = type === "application/pdf" ? "pdf" : type.split("/")[1] || "img"
    const bytes = Buffer.from(await file.arrayBuffer())
    const url = await uploadProof(txid, bytes, type, ext)
    await setOrderProofUrl(txid, url)
    return NextResponse.json({ ok: true, url })
  } catch (e) {
    console.error("[PROOF UPLOAD] Erro:", e)
    return NextResponse.json({ ok: false, error: "Falha ao subir comprovante." }, { status: 500 })
  }
}
