import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle, KeyRound } from "lucide-react"
import { adminConfigured, isAuthed } from "@/lib/admin-auth"
import { getEnvStatus, type EnvItem, type EnvLevel } from "@/lib/env-status"
import { getActiveGateway } from "@/lib/gateways/active"
import { AdminLogin } from "../admin-login"
import { RefreshButton } from "./refresh-button"

export const dynamic = "force-dynamic"

const LEVEL_BADGE: Record<EnvLevel, { label: string; cls: string }> = {
  required: { label: "Obrigatória", cls: "bg-red-50 text-red-600 border-red-200" },
  recommended: { label: "Recomendada", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  optional: { label: "Opcional", cls: "bg-muted text-muted-foreground border-border" },
}

function LevelBadge({ level }: { level: EnvLevel }) {
  const b = LEVEL_BADGE[level]
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold ${b.cls}`}>
      {b.label}
    </span>
  )
}

function StatusBadge({ item }: { item: EnvItem }) {
  if (item.present) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" /> Ativa
      </span>
    )
  }
  if (item.level === "optional") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
        Reserva
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
      <XCircle className="h-3.5 w-3.5" /> Faltando
    </span>
  )
}

export default async function AdminConfigPage() {
  if (!adminConfigured()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-lg font-bold text-foreground">Painel não configurado</h1>
          <p className="text-sm text-muted-foreground">
            Defina a variável <code className="font-mono">ADMIN_PASSWORD</code> na Vercel pra liberar o acesso.
          </p>
        </div>
      </div>
    )
  }

  if (!(await isAuthed())) {
    return <AdminLogin />
  }

  const activeGateway = await getActiveGateway()
  const groups = getEnvStatus(activeGateway)
  const all = groups.flatMap((g) => g.items)
  const missingRequired = all.filter((i) => !i.present && i.level === "required").length
  const missingRecommended = all.filter((i) => !i.present && i.level === "recommended").length

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <KeyRound className="h-5 w-5" /> Configuração · Chaves
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Status das variáveis de ambiente. Mostra só se está preenchida — nunca o valor.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <RefreshButton />
            <Link
              href="/admin"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-bold text-foreground transition hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </div>
        </div>

        {/* Resumo */}
        <div className={`mb-6 flex items-center gap-3 rounded-xl border p-4 ${
          missingRequired > 0 ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"
        }`}>
          {missingRequired > 0 ? (
            <>
              <XCircle className="h-6 w-6 shrink-0 text-red-600" />
              <div className="text-sm text-red-800">
                <span className="font-bold">{missingRequired} chave(s) obrigatória(s) faltando.</span>{" "}
                Parte da loja não funciona até configurá-la(s) na Vercel.
                {missingRecommended > 0 && <> ({missingRecommended} recomendada(s) também.)</>}
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
              <div className="text-sm text-emerald-800">
                <span className="font-bold">Tudo essencial configurado.</span>
                {missingRecommended > 0 && <> Faltam {missingRecommended} recomendada(s) — opcionais pro básico.</>}
              </div>
            </>
          )}
        </div>

        {/* Grupos */}
        <div className="space-y-7">
          {groups.map((group) => (
            <section key={group.title}>
              <h2 className="text-base font-bold text-foreground">{group.title}</h2>
              <p className="mb-3 text-xs text-muted-foreground">{group.subtitle}</p>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <div key={item.key} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-foreground">{item.label}</span>
                          <LevelBadge level={item.level} />
                        </div>
                        <code className="mt-0.5 block break-all font-mono text-xs text-muted-foreground">{item.key}</code>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge item={item} />
                      </div>
                    </div>
                    <p className="mt-3 rounded-md bg-muted px-2.5 py-2 text-xs text-foreground">
                      <span className="font-semibold">Na Vercel, coloque:</span> {item.howto}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          As variáveis são lidas do deploy atual. Depois de adicionar/alterar uma na Vercel e reployar,
          clique em <span className="font-semibold">Verificar novamente</span>.
        </p>
      </div>
    </div>
  )
}
