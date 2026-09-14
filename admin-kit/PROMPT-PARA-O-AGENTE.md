# PROMPT — cole isto no agente (Claude Code / Cursor / etc.) da loja de destino

> Como usar: abra o agente **dentro do projeto da outra loja**. Copie a pasta
> `admin-kit/` pra dentro da raiz desse projeto (ela serve de referência). Depois
> cole TODO o texto abaixo da linha como mensagem pro agente.

---

Você vai instalar um **painel administrativo em `/admin`** nesta loja, adaptando ao
código que já existe aqui. Use a pasta `admin-kit/` (na raiz do projeto) como
**referência canônica** dos arquivos e do README — mas **não copie cego**: esta loja
tem outro nicho, outro tema e outra estrutura, então você precisa adaptar.

O painel tem **dois módulos**:

1. **Pedidos** — login por senha, lista de pedidos (pago / aguardando / abandonado),
   cliente, endereço, itens, total, comprovante, e contador de visitantes online.
   É **só leitura**: quem grava os pedidos é o checkout desta loja.
2. **Produtos (CSV)** — lê o catálogo do **CSV que vive no código desta loja**, mostra
   numa tabela e permite **editar / adicionar / excluir**. As mudanças ficam num
   overlay no KV (Upstash); um botão **Exportar CSV** gera o arquivo final pra commitar
   de volta. (Em serverless o filesystem é read-only, por isso NÃO se reescreve o CSV
   em runtime — esse fluxo é proposital.)

## Passo 0 — INVESTIGUE antes de escrever qualquer arquivo

Não presuma nada. Descubra e me reporte:

- **Framework**: é Next.js App Router (`app/`)? Pages Router? Outro (Vite/Remix/etc.)?
  Se NÃO for Next App Router, pare e me avise — os arquivos do kit assumem App Router.
- **Tailwind / design tokens**: esta loja usa os tokens `bg-background`, `text-foreground`,
  `bg-card`, `border-border`, `bg-primary`, `text-primary-foreground`, `text-muted-foreground`,
  `bg-muted`? Se não, liste as classes/cores equivalentes desta loja pra eu mapear.
- **Catálogo de produtos**: onde está o CSV? Qual o caminho relativo à raiz? Abra o
  arquivo e me diga os **cabeçalhos exatos** (qual coluna é o id/chave, nome, preço,
  imagem, categoria, estoque, ativo). Se os produtos NÃO estiverem em CSV (ex.: array
  TS, JSON, banco), me diga o formato real antes de prosseguir.
- **Checkout / pedidos**: como esta loja cria um pedido/pagamento hoje? Existe algum
  ponto onde dá pra chamar `saveOrderSnapshot(...)` ao gerar o pagamento e
  `markOrderPaid(...)` ao confirmar? Existe KV/Upstash já configurado?
- **Alias de import**: o `tsconfig.json` mapeia `@/*` pra raiz? Se usar outro alias,
  ajuste os imports.

Me devolva um resumo dessas respostas. Se algo for ambíguo (principalmente o schema
do CSV), **pergunte** em vez de chutar.

## Passo 1 — Traga os arquivos base

Copie da pasta `admin-kit/` pra dentro desta loja, mantendo a estrutura:

```
admin.config.ts            → raiz
lib/{admin-auth,kv,presence,orders,catalog}.ts
app/admin/                  (page, admin-shell, admin-login, orders-panel,
                             products-panel, online-count, logout-button)
app/api/admin/             (login, logout, products, products/export, products/reset)
app/api/presence/
```

Se esta loja **já tiver** `lib/kv.ts` ou `app/api/presence/`, reaproveite o existente
em vez de duplicar — só garanta que as funções usadas pelo kit existam.

## Passo 2 — Configure `admin.config.ts` (o único arquivo que muda por loja)

- `brand`: nome desta loja.
- `cookieName`: um nome único pra esta loja.
- `modules`: deixe `orders` e `products` ligados (ou desligue o que esta loja não usa).
- `catalog.csvPath`: o caminho REAL do CSV desta loja.
- `catalog.delimiter`: `,` ou `;` conforme o arquivo.
- `catalog.columns`: **mapeie cada campo lógico pro cabeçalho REAL do CSV desta loja.**
  A coluna `id` é a chave de merge — aponte pra coluna única do catálogo (id, sku, código…).

## Passo 3 — Adapte o visual ao tema desta loja

Se os tokens Tailwind forem diferentes, troque as classes nos componentes de
`app/admin/` pelas equivalentes desta loja. O painel deve parecer parte desta loja,
não do projeto original.

## Passo 4 — Ligue o módulo Pedidos ao checkout existente

No fluxo de pagamento desta loja:
- ao **gerar** o pagamento → `await saveOrderSnapshot(txid, { customer, address, items, total, gateway }, Date.now())`
- ao **confirmar** (polling no front ou webhook) → `await markOrderPaid(txid)`
- (opcional) comprovante → `setOrderProofUrl(txid, url)`
- (opcional) contador online → a loja faz `fetch("/api/presence", { method:"POST", body: JSON.stringify({ id: sessionId }) })` a cada ~20s.

Adapte os nomes dos campos (`customer`, `address`, `items`) pro que esta loja já carrega.
Se a loja não tiver pedidos online, deixe o módulo `orders: false` no config.

## Passo 5 — Variáveis de ambiente

- `ADMIN_PASSWORD` (obrigatória) — senha do painel.
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (ou `KV_REST_API_URL`/`KV_REST_API_TOKEN`)
  — necessárias pra pedidos, presença e edição de produtos. Sem elas, o painel abre,
  Pedidos fica vazio e Produtos vira somente-leitura.

## Passo 6 — Valide

- `npm run build` (ou o build desta loja) tem que passar.
- Abra `/admin`, faça login com a `ADMIN_PASSWORD`.
- Confirme que a aba **Produtos** lista o catálogo do CSV desta loja.
- Teste editar um produto, **Exportar CSV**, conferir o arquivo baixado, e **Zerar overlay**.
- Se houver checkout, gere um pedido de teste e confirme que aparece na aba **Pedidos**.

## Regras

- **Não quebre o que já existe.** Se um arquivo do kit colidir com um da loja, me avise
  antes de sobrescrever.
- **Degrade gracioso**: nada deve dar 500 por falta de env var.
- O CSV no código continua sendo a **fonte de verdade** dos produtos — o painel só edita
  via overlay + export. Não invente persistência direta no arquivo em produção.
- Em qualquer ambiguidade real (schema do CSV, formato de pedido), **pergunte**.
