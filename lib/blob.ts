// Upload do comprovante de PIX pro Vercel Blob. Sem BLOB_READ_WRITE_TOKEN
// configurado, blobConfigured() = false e o upload é pulado (sem quebrar nada).

import { put } from "@vercel/blob"

export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

// Sobe o arquivo e devolve a URL pública.
export async function uploadProof(
  txid: string,
  data: Parameters<typeof put>[1],
  contentType: string,
  ext: string,
): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Blob não configurado.")
  const safeExt = (ext || "bin").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "bin"
  const safeTxid = txid.replace(/[^a-z0-9-]/gi, "").slice(0, 60) || "pedido"
  const blob = await put(`comprovantes/${safeTxid}.${safeExt}`, data, {
    access: "public",
    contentType: contentType || "application/octet-stream",
    addRandomSuffix: true,
  })
  return blob.url
}
