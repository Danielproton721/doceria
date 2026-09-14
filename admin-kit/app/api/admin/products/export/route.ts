import { isAuthed } from "@/lib/admin-auth"
import { exportMergedCsv } from "@/lib/catalog"

export const dynamic = "force-dynamic"

// Baixa o CSV final (base + overlay) pra commitar de volta no código.
export async function GET() {
  if (!(await isAuthed())) {
    return new Response("Não autorizado.", { status: 401 })
  }
  const csv = await exportMergedCsv()
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="products.csv"',
      "cache-control": "no-store",
    },
  })
}
