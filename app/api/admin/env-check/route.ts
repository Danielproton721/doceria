import { NextResponse } from "next/server"

import { isAuthed } from "@/lib/admin-auth"
import { getActiveGateway } from "@/lib/gateways/active"

export const dynamic = "force-dynamic"

// Nunca devolve o VALOR das variáveis — só se estão presentes.
const has = (...names: string[]) => names.some((n) => (process.env[n] || "").trim().length > 0)

type Item = { label: string; envs: string[]; set: boolean; level: "req" | "rec" | "opt"; hint: string }
type Group = { title: string; desc: string; items: Item[] }

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }
  const activeGateway = await getActiveGateway()

  const groups: Group[] = [
    {
      title: "Essencial",
      desc: "Sem isto a loja não opera.",
      items: [
        { label: "Senha do painel", envs: ["ADMIN_PASSWORD"], set: has("ADMIN_PASSWORD"), level: "req", hint: "Libera o acesso a este painel." },
        { label: "Endereço da loja", envs: ["NEXT_PUBLIC_APP_URL"], set: has("NEXT_PUBLIC_APP_URL"), level: "rec", hint: "https://www.lumidocura.shop — usado em links, e-mail e no retorno do pagamento." },
      ],
    },
    {
      title: "Banco de dados (Upstash)",
      desc: "Sem isto: não salva pedido, nem visitante, nem a troca de gateway.",
      items: [
        { label: "URL do Upstash", envs: ["UPSTASH_REDIS_REST_URL", "KV_REST_API_URL"], set: has("UPSTASH_REDIS_REST_URL", "KV_REST_API_URL"), level: "req", hint: "Aceita os dois nomes." },
        { label: "Token do Upstash", envs: ["UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN"], set: has("UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN"), level: "req", hint: "Aceita os dois nomes." },
        { label: "Prefixo das chaves", envs: ["KV_PREFIX"], set: has("KV_PREFIX"), level: "opt", hint: 'Só se dividir o mesmo banco com outra loja (ex.: "lumi:").' },
      ],
    },
    {
      title: `Pagamento (ativo: ${activeGateway})`,
      desc: "Só o gateway ATIVO precisa estar preenchido. Os outros são reserva.",
      items: [
        { label: "Pagou.ai — chave secreta", envs: ["PAGOUAI_SECRET_KEY"], set: has("PAGOUAI_SECRET_KEY"), level: activeGateway === "pagou" ? "req" : "opt", hint: "Obrigatória se a Pagou.ai for o gateway ativo." },
        { label: "Pagou.ai — chave pública", envs: ["NEXT_PUBLIC_PAGOUAI_PUBLIC_KEY"], set: has("NEXT_PUBLIC_PAGOUAI_PUBLIC_KEY"), level: activeGateway === "pagou" ? "rec" : "opt", hint: "Usada no fluxo de cartão." },
        { label: "Segredo do webhook", envs: ["PAGOUAI_WEBHOOK_SECRET"], set: has("PAGOUAI_WEBHOOK_SECRET"), level: "req", hint: "Sem ele o webhook aceita qualquer chamada." },
        { label: "MedusaPay — chave", envs: ["MEDUSAPAY_SECRET_KEY"], set: has("MEDUSAPAY_SECRET_KEY"), level: activeGateway === "medusa" ? "req" : "opt", hint: "Atenção: o código da MedusaPay ainda usa a API antiga." },
        { label: "CenturionPay — chave", envs: ["CENTURION_API_KEY"], set: has("CENTURION_API_KEY"), level: activeGateway === "centurion" ? "req" : "opt", hint: "Só se usar a CenturionPay." },
      ],
    },
    {
      title: "E-mail (Resend)",
      desc: "Sem isto o pedido é pago, mas o cliente não recebe e-mail.",
      items: [
        { label: "Resend — API key", envs: ["RESEND_API_KEY"], set: has("RESEND_API_KEY"), level: "rec", hint: "Envia confirmação e carrinho abandonado." },
        { label: "Resend — remetente", envs: ["RESEND_FROM_EMAIL"], set: has("RESEND_FROM_EMAIL"), level: "rec", hint: 'Ex.: "Lumi Doçura <contato@lumidocura.shop>" — domínio precisa estar verificado no Resend.' },
        { label: "Responder para", envs: ["RESEND_REPLY_TO"], set: has("RESEND_REPLY_TO"), level: "opt", hint: "Pra onde vai a resposta do cliente." },
        { label: "Cópia das vendas", envs: ["STORE_EMAIL"], set: has("STORE_EMAIL"), level: "opt", hint: "Recebe uma cópia de cada pedido." },
      ],
    },
    {
      title: "Relay do pagamento",
      desc: "Esconde o endereço da loja do gateway. Opcional, mas se usar, as duas andam juntas.",
      items: [
        { label: "URL do relay", envs: ["NOTIFY_URL_OVERRIDE"], set: has("NOTIFY_URL_OVERRIDE"), level: "opt", hint: "O slot da Lumi no painel do relay." },
        { label: "Segredo do relay", envs: ["RELAY_SECRET"], set: has("RELAY_SECRET"), level: "opt", hint: "O webhook exige este segredo no cabeçalho." },
      ],
    },
    {
      title: "Extras",
      desc: "Funcionam sem, mas somam.",
      items: [
        { label: "Carrinho abandonado (QStash)", envs: ["QSTASH_TOKEN"], set: has("QSTASH_TOKEN"), level: "opt", hint: "Agenda o e-mail de quem gerou PIX e não pagou." },
        { label: "Comprovante do cliente (Blob)", envs: ["BLOB_READ_WRITE_TOKEN"], set: has("BLOB_READ_WRITE_TOKEN"), level: "opt", hint: "Deixa o cliente anexar o comprovante do PIX." },
      ],
    },
  ]

  return NextResponse.json({ activeGateway, groups })
}
