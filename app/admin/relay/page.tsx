import Link from "next/link"
import { headers } from "next/headers"
import { ArrowLeft, KeyRound, RadioTower, ShieldCheck } from "lucide-react"
import { adminConfigured, isAuthed } from "@/lib/admin-auth"
import { AdminLogin } from "../admin-login"
import { CopyButton } from "./copy-button"

export const dynamic = "force-dynamic"

// O id do relay muda por loja (cada loja tem o seu slot), então NÃO chumbamos a
// URL aqui — senão a tela mente numa das lojas. Validamos só que o
// NOTIFY_URL_OVERRIDE tem cara de endpoint de relay. Serve qualquer loja.
const RELAY_PATH_MARKER = "/api/webhooks/payment/"
const WEBHOOK_PATH = "/api/webhook/pagou"

async function getStoreBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "")
  if (configured) return configured

  const h = await headers()
  const host = h.get("x-forwarded-host") || h.get("host")
  if (host) {
    const proto = h.get("x-forwarded-proto") || "https"
    return `${proto}://${host}`.replace(/\/$/, "")
  }

  return "https://v0-del-ivery-copia-dany.vercel.app"
}

function Field({
  title,
  value,
  muted,
  canCopy = true,
}: {
  title: string
  value: string
  muted?: boolean
  canCopy?: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
        <CopyButton value={value} disabled={!canCopy} />
      </div>
      <code className={`block break-all rounded-md bg-muted px-3 py-2 font-mono text-xs ${muted ? "text-muted-foreground" : "text-foreground"}`}>
        {value}
      </code>
    </div>
  )
}

export default async function RelayAdminPage() {
  if (!adminConfigured()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-lg font-bold text-foreground">Painel nao configurado</h1>
          <p className="text-sm text-muted-foreground">
            Defina a variavel <code className="font-mono">ADMIN_PASSWORD</code> na Vercel pra liberar o acesso.
          </p>
        </div>
      </div>
    )
  }

  if (!(await isAuthed())) {
    return <AdminLogin />
  }

  const storeBaseUrl = await getStoreBaseUrl()
  const destinationUrl = `${storeBaseUrl}${WEBHOOK_PATH}`
  // Valores REAIS do deployment (nao usar fallback hardcoded aqui: a tela precisa
  // refletir o que a loja esta de fato usando pra conferencia honesta).
  const notifyOverride = process.env.NOTIFY_URL_OVERRIDE?.trim() || ""
  const relaySecret = process.env.RELAY_SECRET?.trim() || ""
  // "Configurado" = a env existe e aponta pro relay. Não comparamos com um id
  // fixo (que difere entre compadre, cumpadi, etc.) — só com o padrão do relay.
  const notifyConfigured = Boolean(notifyOverride) && notifyOverride.includes(RELAY_PATH_MARKER)
  const envBlock = `NOTIFY_URL_OVERRIDE=${notifyOverride || "https://SEU-RELAY/api/webhooks/payment/ID_DA_LOJA"}\nRELAY_SECRET=${relaySecret || "COLE_O_SEGREDO_DO_RELAY"}`

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para pedidos
            </Link>
            <h1 className="text-xl font-bold text-foreground">Relay de pagamento</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Dados para copiar no relay intermediario que recebe a Pagou.ai e repassa para esta loja.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Webhook isolado
          </div>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <RadioTower className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-foreground">Destino do relay</p>
            <p className="mt-1 text-xs text-muted-foreground">Configure isto no relay como URL de repasse.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <KeyRound className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-foreground">Header obrigatorio</p>
            <p className="mt-1 text-xs text-muted-foreground">O relay deve enviar x-relay-secret em cada POST.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-foreground">Corpo intacto</p>
            <p className="mt-1 text-xs text-muted-foreground">Repassar o JSON da Pagou.ai sem transformar campos.</p>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-foreground">1. Configurar no relay como destino</h2>
              <p className="mt-1 text-xs text-muted-foreground">Esses sao os dados que o relay deve usar para chamar esta loja.</p>
            </div>
            <div className="grid gap-3">
              <Field title="URL destino" value={destinationUrl} />
              <Field title="Metodo" value="POST" />
              <Field title="Header" value="x-relay-secret" />
              <Field
                title="Valor do header"
                value={relaySecret || "RELAY_SECRET nao definida neste deployment"}
                muted={!relaySecret}
                canCopy={Boolean(relaySecret)}
              />
              <Field title="Content-Type" value="application/json" />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-foreground">2. URL que vai no gateway</h2>
              <p className="mt-1 text-xs text-muted-foreground">A Pagou.ai deve chamar o relay, nunca o dominio real da loja.</p>
            </div>
            <div className="grid gap-3">
              <Field
                title="notify_url atual (NOTIFY_URL_OVERRIDE no deployment)"
                value={notifyOverride || "NOTIFY_URL_OVERRIDE nao definida neste deployment"}
                muted={!notifyOverride}
                canCopy={Boolean(notifyOverride)}
              />
            </div>
            {notifyConfigured ? (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                NOTIFY_URL_OVERRIDE aponta pro relay. O gateway so ve o dominio do relay, nunca o desta loja.
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                {notifyOverride
                  ? "NOTIFY_URL_OVERRIDE nao parece um endpoint de relay (esperado conter /api/webhooks/payment/). Confira o valor e faca REDEPLOY."
                  : "NOTIFY_URL_OVERRIDE ainda nao esta definida neste deployment. Defina a env na Vercel e faca REDEPLOY pro gateway usar o relay."}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-foreground">3. Envs esperadas na producao</h2>
              <p className="mt-1 text-xs text-muted-foreground">Referencia rapida para conferir se o deployment esta com o contrato certo.</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Bloco .env</p>
                <CopyButton value={envBlock} disabled={!relaySecret} />
              </div>
              <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs text-foreground">
                {envBlock}
              </pre>
            </div>
            {!relaySecret && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                RELAY_SECRET nao esta definida neste deployment. O webhook ainda aceita chamadas sem esse header ate a env ser configurada.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
