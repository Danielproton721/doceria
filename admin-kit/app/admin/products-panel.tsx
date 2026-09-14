"use client"

import { useMemo, useState } from "react"
import { Download, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react"
import type { Catalog, ProductRow } from "@/lib/catalog"

export function ProductsPanel({
  initialCatalog,
  columns,
  kvOk,
  initialPending,
}: {
  initialCatalog: Catalog
  columns: Record<string, string>
  kvOk: boolean
  initialPending: number
}) {
  const [catalog, setCatalog] = useState<Catalog>(initialCatalog)
  const [pending, setPending] = useState(initialPending)
  const [editing, setEditing] = useState<ProductRow | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const idHeader = columns.id
  const headers = catalog.headers

  // Colunas "amigáveis" mostradas na tabela (as mapeadas que existem no CSV).
  const displayCols = useMemo(() => {
    const order = ["id", "name", "price", "category", "stock", "active"]
    return order.map((k) => columns[k]).filter((h) => h && headers.includes(h))
  }, [columns, headers])

  const imageHeader = columns.image && headers.includes(columns.image) ? columns.image : null

  async function refresh() {
    const r = await fetch("/api/admin/products", { cache: "no-store" })
    const d = await r.json().catch(() => null)
    if (d?.catalog) setCatalog(d.catalog)
    if (typeof d?.pending === "number") setPending(d.pending)
  }

  function startNew() {
    const blank: ProductRow = {}
    headers.forEach((h) => (blank[h] = ""))
    setEditing(blank)
    setIsNew(true)
    setMsg(null)
  }

  function startEdit(row: ProductRow) {
    setEditing({ ...row })
    setIsNew(false)
    setMsg(null)
  }

  async function save() {
    if (!editing) return
    if (!(editing[idHeader] ?? "").trim()) {
      setMsg({ ok: false, text: `Preencha a coluna de id ("${idHeader}").` })
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      const r = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ row: editing }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d?.error || "Erro ao salvar.")
      await refresh()
      setEditing(null)
      setMsg({ ok: true, text: isNew ? "Produto adicionado." : "Produto atualizado." })
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || "Erro ao salvar." })
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!confirm(`Excluir o produto "${id}"?`)) return
    setBusy(true)
    setMsg(null)
    try {
      const r = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d?.error || "Erro ao excluir.")
      await refresh()
      setMsg({ ok: true, text: "Produto excluído." })
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || "Erro ao excluir." })
    } finally {
      setBusy(false)
    }
  }

  async function resetOverlay() {
    if (!confirm("Zerar as mudanças pendentes? Faça isso só DEPOIS de exportar o CSV e commitar no código.")) return
    setBusy(true)
    setMsg(null)
    try {
      const r = await fetch("/api/admin/products/reset", { method: "POST" })
      if (!r.ok) throw new Error("Erro ao zerar.")
      await refresh()
      setMsg({ ok: true, text: "Overlay zerado — agora a base é só o CSV." })
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || "Erro ao zerar." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {/* Barra de ações */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {catalog.rows.length} produto(s)
          {pending > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              {pending} mudança(s) pendente(s)
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={startNew}
            disabled={!kvOk || busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Adicionar
          </button>
          <a
            href="/api/admin/products/export"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-bold text-foreground hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </a>
          <button
            onClick={resetOverlay}
            disabled={!kvOk || busy || pending === 0}
            title="Zerar mudanças pendentes (use após commitar o CSV exportado)"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" /> Zerar overlay
          </button>
        </div>
      </div>

      {!kvOk && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          KV (Upstash) não configurado — catálogo em <strong>somente leitura</strong>. Liga o KV pra editar/adicionar
          (veja o README). O CSV no código continua sendo a fonte.
        </div>
      )}

      {msg && (
        <p className={`mb-3 text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>
      )}

      {/* Editor (inline) */}
      {editing && (
        <div className="mb-4 rounded-xl border border-primary/30 bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-foreground">{isNew ? "Novo produto" : "Editar produto"}</h3>
            <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {headers.map((h) => (
              <label key={h} className="text-xs font-semibold text-muted-foreground">
                {h}
                {h === idHeader && !isNew ? " (chave)" : ""}
                <input
                  value={editing[h] ?? ""}
                  onChange={(e) => setEditing({ ...editing, [h]: e.target.value })}
                  disabled={h === idHeader && !isNew}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={save}
              disabled={busy}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Salvando…" : "Salvar"}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabela de produtos */}
      {catalog.rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum produto encontrado (coluna de id: <code className="font-mono">{idHeader}</code>). Confira o
          caminho do arquivo e o mapa de colunas em <code className="font-mono">admin.config.ts</code>.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                {imageHeader && <th className="px-4 py-3 font-semibold">Img</th>}
                {displayCols.map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {catalog.rows.map((row) => {
                const id = row[idHeader]
                return (
                  <tr key={id} className="border-b border-border/60 last:border-0">
                    {imageHeader && (
                      <td className="px-4 py-2">
                        {row[imageHeader] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row[imageHeader]} alt="" className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted" />
                        )}
                      </td>
                    )}
                    {displayCols.map((h) => (
                      <td key={h} className="px-4 py-2 text-foreground">{row[h]}</td>
                    ))}
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => startEdit(row)}
                          disabled={!kvOk}
                          title="Editar"
                          className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => remove(id)}
                          disabled={!kvOk}
                          title="Excluir"
                          className="rounded-lg border border-border p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
