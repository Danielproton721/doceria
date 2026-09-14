// Diagnóstico de configuração do /admin.
//
// SEGURANÇA: só reporta a PRESENÇA de cada variável (true/false) — NUNCA o
// valor. Roda exclusivamente no servidor (chamado pelo server component
// app/admin/config/page.tsx). Nenhum segredo é enviado ao browser.

import type { GatewayId } from "@/lib/gateways/active"

export type EnvLevel = "required" | "recommended" | "optional"

export type EnvItem = {
  label: string // nome amigável (PT)
  key: string // nome(s) técnico(s) da variável na Vercel
  level: EnvLevel
  present: boolean
  impact: string
  howto: string // o que colocar EXATAMENTE como valor na Vercel
}

export type EnvGroup = {
  title: string
  subtitle: string
  items: EnvItem[]
}

const has = (v?: string) => Boolean(v && v.trim())

const GW_LABEL: Record<GatewayId, string> = {
  pagou: "Pagou.ai",
  medusa: "MedusaPay",
  centurion: "CenturionPay",
}

export function getEnvStatus(activeGateway: GatewayId): EnvGroup[] {
  const e = process.env

  // KV aceita os dois pares de nomes (Upstash direto ou o alias da Vercel).
  const kvUrl = has(e.KV_REST_API_URL) || has(e.UPSTASH_REDIS_REST_URL)
  const kvToken = has(e.KV_REST_API_TOKEN) || has(e.UPSTASH_REDIS_REST_TOKEN)

  // A chave do gateway ATIVO é obrigatória; a dos inativos é reserva (opcional).
  const gwLevel = (id: GatewayId): EnvLevel => (activeGateway === id ? "required" : "optional")

  // Relay ligado? Com RELAY_SECRET, o webhook valida por ele e IGNORA o
  // PAGOUAI_WEBHOOK_SECRET — então este último deixa de ser necessário.
  const relayOn = has(e.RELAY_SECRET)

  return [
    {
      title: "Essencial",
      subtitle: "Sem isto a loja não opera.",
      items: [
        {
          label: "Senha do painel admin",
          key: "ADMIN_PASSWORD",
          level: "required",
          present: has(e.ADMIN_PASSWORD),
          impact: "Sem ela o /admin fica bloqueado.",
          howto: "A senha que você digita pra entrar neste painel. Escolha uma forte.",
        },
        {
          label: "Domínio da loja",
          key: "NEXT_PUBLIC_APP_URL",
          level: "recommended",
          present: has(e.NEXT_PUBLIC_APP_URL),
          impact: "Usado no logo do e-mail e no webhook dos gateways novos.",
          howto: "O endereço público da loja, SEM barra no final. Ex.: https://cumpadifood.com.",
        },
      ],
    },
    {
      title: "Banco de dados (Upstash/KV)",
      subtitle: "Sem isto: não salva pedidos, visitantes nem a troca de gateway.",
      items: [
        {
          label: "URL do Upstash",
          key: "KV_REST_API_URL / UPSTASH_REDIS_REST_URL",
          level: "required",
          present: kvUrl,
          impact: "Endereço REST do banco Redis.",
          howto: "Em upstash.com → seu Redis → Details → REST API: copie a URL (https://...upstash.io).",
        },
        {
          label: "Token do Upstash",
          key: "KV_REST_API_TOKEN / UPSTASH_REDIS_REST_TOKEN",
          level: "required",
          present: kvToken,
          impact: "Senha de acesso ao banco Redis.",
          howto: "No mesmo lugar (Details → REST API): copie o Token (string longa).",
        },
      ],
    },
    {
      title: `Gateway de pagamento (ativo: ${GW_LABEL[activeGateway]})`,
      subtitle: "Só o gateway ATIVO precisa estar configurado. Os outros são reserva.",
      items: [
        {
          label: "Pagou.ai — chave secreta",
          key: "PAGOUAI_SECRET_KEY",
          level: gwLevel("pagou"),
          present: has(e.PAGOUAI_SECRET_KEY),
          impact: "Gera o PIX/cartão quando o gateway ativo é Pagou.ai.",
          howto: "Cole a Secret Key do painel da Pagou.ai (Configurações → API/Chaves).",
        },
        {
          label: "Pagou.ai — chave pública",
          key: "NEXT_PUBLIC_PAGOUAI_PUBLIC_KEY",
          level: activeGateway === "pagou" ? "recommended" : "optional",
          present: has(e.NEXT_PUBLIC_PAGOUAI_PUBLIC_KEY),
          impact: "Sem ela o pagamento por CARTÃO não funciona (o PIX funciona só com a secret).",
          howto: "Cole a Public Key da Pagou.ai (começa com pk_live_ ou pk_test_).",
        },
        {
          label: "MedusaPay — chave",
          key: "MEDUSAPAY_SECRET_KEY",
          level: gwLevel("medusa"),
          present: has(e.MEDUSAPAY_SECRET_KEY),
          impact: "Gera o PIX quando o gateway ativo é MedusaPay.",
          howto: "Cole a Secret Key da MedusaPay (Settings → API Credentials; começa com sk_live_ ou sk_test_).",
        },
        {
          label: "CenturionPay — chave",
          key: "CENTURION_API_KEY",
          level: gwLevel("centurion"),
          present: has(e.CENTURION_API_KEY),
          impact: "Gera o PIX quando o gateway ativo é CenturionPay.",
          howto: "Cole a API Key do painel da CenturionPay (a chave enviada no header x-api-key).",
        },
      ],
    },
    {
      title: "E-mail (Resend)",
      subtitle: "Sem isto: o e-mail de confirmação não sai (a venda não trava).",
      items: [
        {
          label: "Chave da API (Resend)",
          key: "RESEND_API_KEY",
          level: "recommended",
          present: has(e.RESEND_API_KEY),
          impact: "Sem ela, o e-mail de confirmação não é enviado.",
          howto: "Cole a API Key do painel do Resend (resend.com → API Keys → Create). Começa com re_.",
        },
        {
          label: "Remetente do e-mail",
          key: "RESEND_FROM_EMAIL",
          level: "recommended",
          present: has(e.RESEND_FROM_EMAIL),
          impact: "Sem domínio verificado, o Resend só envia em modo teste.",
          howto: 'Formato "Nome <email@seudominio.com>". Ex.: CumpadiFood <pedidos@cumpadifood.com>.',
        },
        {
          label: "Responder para",
          key: "RESEND_REPLY_TO",
          level: "optional",
          present: has(e.RESEND_REPLY_TO),
          impact: "Pra onde vão as respostas quando o CLIENTE responde o e-mail.",
          howto: "Um e-mail SEU. Quando o cliente clicar em 'Responder' no e-mail de confirmação, vai pra este endereço. Ex.: pedidos-suporte@cumpadifood.com.",
        },
      ],
    },
    {
      title: "Extras (opcionais)",
      subtitle: "Recursos a mais. Sem eles, a loja funciona normal.",
      items: [
        {
          label: "Segredo do webhook",
          key: "PAGOUAI_WEBHOOK_SECRET",
          // Com o relay ligado (RELAY_SECRET), este não é usado — vira opcional.
          level: relayOn ? "optional" : "recommended",
          present: has(e.PAGOUAI_WEBHOOK_SECRET),
          impact: relayOn
            ? "NÃO é necessário: o relay está ativo, quem protege o webhook é o RELAY_SECRET."
            : "Protege o webhook da Pagou quando ele é chamado DIRETO (sem relay).",
          howto: relayOn
            ? "Pode deixar vazio. Com o relay ligado, esta chave é ignorada (o RELAY_SECRET faz o papel dela)."
            : "Invente uma senha aleatória forte. Use o MESMO valor aqui e na URL do webhook na Pagou (?secret=...).",
        },
        {
          label: "Carrinho abandonado",
          key: "QSTASH_TOKEN + QSTASH_URL",
          level: "optional",
          present: has(e.QSTASH_TOKEN) && has(e.QSTASH_URL),
          impact: "E-mail de carrinho abandonado. Sem eles, não é agendado.",
          howto: "No console do Upstash → QStash → aba .env: copie o QSTASH_TOKEN e a QSTASH_URL. Duas variáveis.",
        },
        {
          label: "Comprovante de PIX",
          key: "BLOB_READ_WRITE_TOKEN",
          level: "optional",
          present: has(e.BLOB_READ_WRITE_TOKEN),
          impact: "Upload do comprovante de PIX. Sem ele, o upload é pulado.",
          howto: "Criado automático ao adicionar um Blob Store na Vercel (Storage → Create → Blob).",
        },
        {
          label: "Relay — URL",
          key: "NOTIFY_URL_OVERRIDE",
          level: "optional",
          present: has(e.NOTIFY_URL_OVERRIDE),
          impact: "Relay: esconde o domínio da loja do gateway Pagou.",
          howto: "A URL do relay que recebe o webhook no seu lugar (ex.: https://www.fionobres.shop/api/webhooks/payment/<chave>).",
        },
        {
          label: "Relay — segredo",
          key: "RELAY_SECRET",
          level: "optional",
          present: has(e.RELAY_SECRET),
          impact: "Valida a origem do webhook que vem do relay.",
          howto: "O mesmo segredo configurado no painel do relay pra esta loja.",
        },
      ],
    },
  ]
}
