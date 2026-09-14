// ============================================================================
//  CATÁLOGO DE PRODUTOS (módulo Produtos do painel)
//
//  Modelo de dados, pensado pra serverless (Vercel = filesystem read-only):
//   • O CSV no código é a FONTE BASE (lida do disco, nunca reescrita em runtime).
//   • Edições / adições / remoções feitas no painel ficam num OVERLAY no KV.
//   • A leitura mescla base + overlay; o painel mostra o resultado.
//   • "Exportar CSV" gera o arquivo final mesclado pra você baixar e commitar
//     de volta no código quando quiser tornar permanente (e zerar o overlay).
//
//  Cada produto é um Record<header, valor> com os cabeçalhos ORIGINAIS do seu
//  CSV — assim o export reescreve o arquivo idêntico ao que você já versiona.
//  O mapeamento lógico (qual coluna é id/nome/preço…) vem de admin.config.ts.
// ============================================================================

import { promises as fs } from "fs"
import path from "path"
import { adminConfig } from "@/admin.config"
import { kvConfigured, kvGetJSON, kvSetJSON } from "./kv"

export type ProductRow = Record<string, string>

export type Catalog = {
  headers: string[]
  rows: ProductRow[]
}

const OVERRIDES_KEY = "catalog:overrides" // { [idValue]: ProductRow }  (edições + novos)
const DELETED_KEY = "catalog:deleted" //     string[]                  (ids removidos)

const cfg = adminConfig.catalog
const ID_HEADER = cfg.columns.id

// --- Parser CSV (sem dependência) -------------------------------------------
// Lida com: aspas, delimitador/quebra de linha dentro de aspas, aspas
// escapadas (""), CRLF/LF e BOM. Campos sempre retornam como string.
export function parseCsv(text: string, delimiter = ","): Catalog {
  const clean = text.replace(/^﻿/, "") // remove BOM
  const rowsRaw: string[][] = []
  let field = ""
  let row: string[] = []
  let inQuotes = false

  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i]
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      row.push(field)
      field = ""
    } else if (ch === "\n") {
      row.push(field)
      rowsRaw.push(row)
      row = []
      field = ""
    } else if (ch === "\r") {
      // ignora; o \n seguinte fecha a linha
    } else {
      field += ch
    }
  }
  // último campo/linha (se o arquivo não terminar em \n)
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rowsRaw.push(row)
  }

  if (rowsRaw.length === 0) return { headers: [], rows: [] }

  const headers = rowsRaw[0].map((h) => h.trim())
  const rows: ProductRow[] = rowsRaw
    .slice(1)
    .filter((r) => r.some((c) => c.trim() !== "")) // pula linhas vazias
    .map((r) => {
      const obj: ProductRow = {}
      headers.forEach((h, idx) => {
        obj[h] = (r[idx] ?? "").trim()
      })
      return obj
    })
  return { headers, rows }
}

// --- Serializador CSV -------------------------------------------------------
function escapeCell(value: string, delimiter: string): string {
  const v = value ?? ""
  if (v.includes('"') || v.includes(delimiter) || v.includes("\n") || v.includes("\r")) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

export function toCsv(catalog: Catalog, delimiter = ","): string {
  const { headers, rows } = catalog
  const lines = [headers.map((h) => escapeCell(h, delimiter)).join(delimiter)]
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h] ?? "", delimiter)).join(delimiter))
  }
  return lines.join("\n") + "\n"
}

// --- Base (disco, somente leitura) ------------------------------------------
let baseCache: Catalog | null = null

export async function readBaseCatalog(): Promise<Catalog> {
  if (baseCache) return baseCache
  const abs = path.join(process.cwd(), cfg.csvPath)
  try {
    const text = await fs.readFile(abs, "utf8")
    baseCache = parseCsv(text, cfg.delimiter)
  } catch {
    baseCache = { headers: Object.values(cfg.columns), rows: [] }
  }
  return baseCache
}

// --- Overlay (KV) -----------------------------------------------------------
async function readOverrides(): Promise<Record<string, ProductRow>> {
  if (!kvConfigured()) return {}
  return (await kvGetJSON<Record<string, ProductRow>>(OVERRIDES_KEY)) ?? {}
}

async function readDeleted(): Promise<string[]> {
  if (!kvConfigured()) return []
  return (await kvGetJSON<string[]>(DELETED_KEY)) ?? []
}

// --- Catálogo mesclado (o que o painel mostra) ------------------------------
export async function getMergedCatalog(): Promise<Catalog> {
  const base = await readBaseCatalog()
  const overrides = await readOverrides()
  const deleted = new Set(await readDeleted())

  // Garante que todo header conhecido apareça (base + os do overlay).
  const headerSet = new Set(base.headers)
  for (const row of Object.values(overrides)) {
    for (const h of Object.keys(row)) headerSet.add(h)
  }
  if (!headerSet.has(ID_HEADER)) headerSet.add(ID_HEADER)
  const headers = Array.from(headerSet)

  const byId = new Map<string, ProductRow>()
  for (const row of base.rows) {
    const id = row[ID_HEADER]
    if (id) byId.set(id, row)
  }
  // Aplica edições e adições do overlay por cima.
  for (const [id, row] of Object.entries(overrides)) {
    byId.set(id, { ...byId.get(id), ...row })
  }
  // Remove os deletados.
  for (const id of deleted) byId.delete(id)

  // Normaliza: toda row final tem todas as headers.
  const rows = Array.from(byId.values()).map((row) => {
    const full: ProductRow = {}
    for (const h of headers) full[h] = row[h] ?? ""
    return full
  })

  return { headers, rows }
}

// --- Mutações (gravam no overlay KV) ----------------------------------------
export class CatalogReadonlyError extends Error {
  constructor() {
    super("KV (Upstash) não configurado — o catálogo está em modo somente leitura.")
    this.name = "CatalogReadonlyError"
  }
}

export async function upsertProduct(row: ProductRow): Promise<void> {
  if (!kvConfigured()) throw new CatalogReadonlyError()
  const id = (row[ID_HEADER] ?? "").trim()
  if (!id) throw new Error(`Produto sem "${ID_HEADER}" (coluna de id).`)

  const overrides = await readOverrides()
  overrides[id] = { ...overrides[id], ...row, [ID_HEADER]: id }
  await kvSetJSON(OVERRIDES_KEY, overrides)

  // Se estava marcado como deletado, "ressuscita".
  const deleted = await readDeleted()
  if (deleted.includes(id)) {
    await kvSetJSON(DELETED_KEY, deleted.filter((d) => d !== id))
  }
}

export async function deleteProduct(id: string): Promise<void> {
  if (!kvConfigured()) throw new CatalogReadonlyError()
  const key = (id ?? "").trim()
  if (!key) return

  // Remove de adições/edições do overlay, se houver.
  const overrides = await readOverrides()
  if (overrides[key]) {
    delete overrides[key]
    await kvSetJSON(OVERRIDES_KEY, overrides)
  }
  // Marca como deletado (cobre o caso de existir na base do CSV).
  const deleted = await readDeleted()
  if (!deleted.includes(key)) {
    deleted.push(key)
    await kvSetJSON(DELETED_KEY, deleted)
  }
}

// Zera o overlay — use DEPOIS de exportar o CSV e commitar as mudanças.
export async function resetOverlay(): Promise<void> {
  if (!kvConfigured()) throw new CatalogReadonlyError()
  await kvSetJSON(OVERRIDES_KEY, {})
  await kvSetJSON(DELETED_KEY, [])
}

// CSV final (base + overlay) pra download.
export async function exportMergedCsv(): Promise<string> {
  const merged = await getMergedCatalog()
  return toCsv(merged, cfg.delimiter)
}

// Quantas mudanças pendentes existem no overlay (pra avisar no painel).
export async function pendingChangesCount(): Promise<number> {
  const overrides = await readOverrides()
  const deleted = await readDeleted()
  return Object.keys(overrides).length + deleted.length
}
