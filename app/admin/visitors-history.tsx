"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { DayPicker, type DateRange } from "react-day-picker"
import { ptBR } from "date-fns/locale"
import { format, startOfMonth, subDays } from "date-fns"
import { CalendarDays, ChevronDown, TrendingUp, TrendingDown, Users, CalendarCheck, Minus } from "lucide-react"
import * as Popover from "@radix-ui/react-popover"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import "react-day-picker/style.css"

type Day = { date: string; count: number }
type Report = { days: Day[]; total: number; prevTotal: number }

// Vermelho da marca CompadreFood (mesmo tom do --primary do globals.css).
const BRAND = "#e23c2f"

// Data local → "AAAA-MM-DD" (usa o que o usuário VÊ no calendário, sem conversão
// de fuso — loja e operador são BR, bate com o servidor).
function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
// "2026-07-06" → "06/07"
function labelDay(iso: string): string {
  const [, m, d] = iso.split("-")
  return `${d}/${m}`
}

const MAX_DAYS = 45

function buildPresets(today: Date) {
  const d = (n: number) => subDays(today, n)
  return [
    { key: "today", label: "Hoje", from: today, to: today },
    { key: "yesterday", label: "Ontem", from: d(1), to: d(1) },
    { key: "7", label: "Últimos 7 dias", from: d(6), to: today },
    { key: "14", label: "Últimos 14 dias", from: d(13), to: today },
    { key: "month", label: "Este mês", from: startOfMonth(today), to: today },
    { key: "30", label: "Últimos 30 dias", from: d(29), to: today },
    { key: "all", label: "Todo o período", from: d(MAX_DAYS - 1), to: today },
  ] as const
}

export function VisitorsHistory() {
  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])
  const presets = useMemo(() => buildPresets(today), [today])

  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<DateRange>({ from: presets[2].from, to: presets[2].to })
  const [presetKey, setPresetKey] = useState<string>("7")
  const [draft, setDraft] = useState<DateRange | undefined>(range)

  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchRange = (r: DateRange) => {
    if (!r.from || !r.to) return
    setLoading(true)
    fetch(`/api/presence?from=${isoLocal(r.from)}&to=${isoLocal(r.to)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => {
        if (Array.isArray(d?.days))
          setReport({ days: d.days, total: Number(d.total) || 0, prevTotal: Number(d.prevTotal) || 0 })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRange(range)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyPreset = (p: { key: string; from: Date; to: Date }) => {
    const r = { from: p.from, to: p.to }
    setRange(r)
    setDraft(r)
    setPresetKey(p.key)
    setOpen(false)
    fetchRange(r)
  }

  const applyDraft = () => {
    if (!draft?.from) return
    const r: DateRange = { from: draft.from, to: draft.to ?? draft.from }
    setRange(r)
    setPresetKey("custom")
    setOpen(false)
    fetchRange(r)
  }

  const triggerLabel = (() => {
    const p = presets.find((x) => x.key === presetKey)
    if (p) return p.label
    if (range.from && range.to) {
      const same = isoLocal(range.from) === isoLocal(range.to)
      return same
        ? format(range.from, "d 'de' MMM", { locale: ptBR })
        : `${format(range.from, "d MMM", { locale: ptBR })} – ${format(range.to, "d MMM", { locale: ptBR })}`
    }
    return "Selecionar período"
  })()

  // --- Métricas derivadas -------------------------------------------------
  const days = report?.days ?? []
  const total = report?.total ?? 0
  const nDays = Math.max(1, days.length)
  const avg = Math.round(days.reduce((s, d) => s + d.count, 0) / nDays)
  const peak = days.reduce<Day | null>((best, d) => (!best || d.count > best.count ? d : best), null)
  const prev = report?.prevTotal ?? 0
  const delta = prev > 0 ? Math.round(((total - prev) / prev) * 100) : null

  const chartData = days.map((d) => ({ ...d, label: labelDay(d.date) }))
  const peakLabel = peak ? labelDay(peak.date) : null

  return (
    <div className="mb-5 rounded-xl border border-border bg-card p-4">
      {/* Cabeçalho + seletor de período */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">Visitantes da loja</h2>
          <p className="text-xs text-muted-foreground">{triggerLabel.toLowerCase()}</p>
        </div>

        <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (o) setDraft(range) }}>
          <Popover.Trigger asChild>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {triggerLabel}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="end"
              sideOffset={8}
              className="z-50 w-[min(92vw,560px)] rounded-xl border border-border bg-card p-0 shadow-xl outline-none"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="flex flex-row flex-wrap gap-1 border-b border-border p-2 sm:w-44 sm:flex-col sm:flex-nowrap sm:border-b-0 sm:border-r">
                  {presets.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => applyPreset(p)}
                      className={`rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                        presetKey === p.key
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col p-3">
                  <DayPicker
                    mode="range"
                    locale={ptBR}
                    selected={draft}
                    onSelect={(r) => { setDraft(r); setPresetKey("custom") }}
                    disabled={{ before: subDays(today, MAX_DAYS - 1), after: today }}
                    className="rdp-cf"
                  />
                  <div className="mt-2 flex items-center justify-end gap-2 border-t border-border pt-3">
                    <button onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted">
                      Cancelar
                    </button>
                    <button onClick={applyDraft} disabled={!draft?.from} className="rounded-lg bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Kpi
          icon={<Users className="h-4 w-4" />}
          label="Total de visitantes"
          value={loading ? "…" : total.toLocaleString("pt-BR")}
          hint="únicos no período"
        />
        <Kpi
          icon={<CalendarCheck className="h-4 w-4" />}
          label="Média por dia"
          value={loading ? "…" : avg.toLocaleString("pt-BR")}
          hint={`${nDays} dia(s)`}
        />
        <Kpi
          icon={<TrendingUp className="h-4 w-4" />}
          label="Melhor dia"
          value={loading || !peak ? "…" : peak.count.toLocaleString("pt-BR")}
          hint={peak ? labelDay(peak.date) : ""}
        />
        <DeltaKpi loading={loading} delta={delta} />
      </div>

      {/* Curva de tendência */}
      <Trend chartData={chartData} loading={loading} peakLabel={peakLabel} peakValue={peak?.count ?? 0} />

      {/* Calendário casado com a marca (vermelho) */}
      <style>{`
        .rdp-cf {
          --rdp-accent-color: ${BRAND};
          --rdp-accent-background-color: #fde3df;
          --rdp-today-color: ${BRAND};
          --rdp-day-width: 34px;
          --rdp-day-height: 34px;
          --rdp-day_button-width: 34px;
          --rdp-day_button-height: 34px;
          margin: 0;
          font-size: 13px;
        }
      `}</style>
    </div>
  )
}

function Kpi({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold leading-tight text-foreground">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  )
}

function DeltaKpi({ loading, delta }: { loading: boolean; delta: number | null }) {
  const up = (delta ?? 0) > 0
  const down = (delta ?? 0) < 0
  const color = delta === null ? "text-muted-foreground" : up ? "text-emerald-600" : down ? "text-red-500" : "text-muted-foreground"
  const Icon = delta === null ? Minus : up ? TrendingUp : down ? TrendingDown : Minus
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] font-medium">vs. período anterior</span>
      </div>
      <div className={`text-2xl font-bold leading-tight ${color}`}>
        {loading ? "…" : delta === null ? "—" : `${up ? "+" : ""}${delta}%`}
      </div>
      <div className="text-[11px] text-muted-foreground">
        {delta === null ? "sem base anterior" : "mesma duração antes"}
      </div>
    </div>
  )
}

function Trend({
  chartData,
  loading,
  peakLabel,
  peakValue,
}: {
  chartData: { label: string; count: number; date: string }[]
  loading: boolean
  peakLabel: string | null
  peakValue: number
}) {
  if (loading && chartData.length === 0) return <div className="h-[190px] animate-pulse rounded-lg bg-muted" />
  if (chartData.length === 0) return <p className="text-sm text-muted-foreground">Sem dados no período.</p>

  const tickStep = Math.max(1, Math.ceil(chartData.length / 7))
  return (
    <div className="h-[190px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="cfBrand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity={0.35} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="currentColor" className="text-border" strokeOpacity={0.5} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            interval={tickStep - 1}
            minTickGap={4}
          />
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: BRAND, strokeOpacity: 0.4 }} />
          <Area type="monotone" dataKey="count" stroke={BRAND} strokeWidth={2} fill="url(#cfBrand)" />
          {peakLabel && peakValue > 0 && (
            <ReferenceDot x={peakLabel} y={peakValue} r={4} fill={BRAND} stroke="#fff" strokeWidth={2} isFront />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function TrendTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload as { label: string; count: number }
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <div className="text-xs text-muted-foreground">{p.label}</div>
      <div className="text-sm font-bold text-foreground">
        {p.count.toLocaleString("pt-BR")} visitante{p.count === 1 ? "" : "s"}
      </div>
    </div>
  )
}
