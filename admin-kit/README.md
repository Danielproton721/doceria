# admin-kit · Painel administrativo portável

Painel `/admin` extraído do CompadreFood e generalizado pra plugar em **qualquer loja Next.js (App Router)**. Dois módulos:

- **Pedidos** — login por senha, lista de pedidos (pago / aguardando / abandonado), cliente, endereço, itens, total, comprovante e contador de visitantes online ao vivo.
- **Produtos (CSV)** — lê o catálogo do **CSV que vive no seu código**, lista numa tabela e deixa **editar / adicionar / excluir**. As mudanças ficam num overlay temporário e o botão **Exportar CSV** gera o arquivo final pra você commitar de volta.

Tudo **degrada gracioso**: sem as variáveis de ambiente, o painel abre e avisa o que falta em vez de quebrar.

---

## 1. Pré-requisitos da loja de destino

- **Next.js** com **App Router** (`app/`).
- **Tailwind CSS** usando os tokens `bg-background`, `text-foreground`, `bg-card`, `border-border`, `bg-primary`, `text-primary-foreground`, `text-muted-foreground`, `bg-muted` (padrão shadcn/v0). Se a sua loja não tiver esses tokens, troque pelas suas classes ou adicione os tokens.
- **lucide-react** instalado (`npm i lucide-react`).
- Alias de import **`@/*` → raiz do projeto** no `tsconfig.json` (padrão v0/Next). Os arquivos importam `@/admin.config`, `@/lib/...`.

---

## 2. Instalação (copiar e colar)

Copie estes itens do kit pra **dentro da raiz da sua loja**, mantendo a estrutura:

```
admin.config.ts              →  <loja>/admin.config.ts
lib/admin-auth.ts            →  <loja>/lib/admin-auth.ts
lib/kv.ts                    →  <loja>/lib/kv.ts
lib/presence.ts              →  <loja>/lib/presence.ts
lib/orders.ts                →  <loja>/lib/orders.ts
lib/catalog.ts               →  <loja>/lib/catalog.ts
app/admin/                   →  <loja>/app/admin/
app/api/admin/               →  <loja>/app/api/admin/
app/api/presence/            →  <loja>/app/api/presence/
data/products.example.csv    →  <loja>/data/products.csv   (ou aponte pro seu CSV existente)
```

> ⚠️ Se a sua loja **já tem** `lib/kv.ts` ou `app/api/presence/`, não duplique — reaproveite o que já existe e só ajuste os imports.

---

## 3. Variáveis de ambiente

| Variável | Pra quê | Obrigatória? |
|---|---|---|
| `ADMIN_PASSWORD` | senha do painel | **Sim** (sem ela o painel fica bloqueado) |
| `UPSTASH_REDIS_REST_URL` | KV (pedidos, presença, overlay de produtos) | Sim pros recursos que usam KV |
| `UPSTASH_REDIS_REST_TOKEN` | idem | idem |

> O `lib/kv.ts` também aceita `KV_REST_API_URL` / `KV_REST_API_TOKEN` (nomes que a integração de Storage da Vercel injeta).

Sem Upstash: o painel abre, **Pedidos** fica vazio e **Produtos** entra em modo somente-leitura (lê o CSV, mas não edita).

---

## 4. Configuração — `admin.config.ts`

É o **único arquivo que você precisa editar**:

```ts
brand: "Minha Loja",          // título do painel
cookieName: "ak_admin",       // troque por loja se rodar várias no mesmo domínio
modules: { orders: true, products: true },   // liga/desliga cada aba
catalog: {
  csvPath: "data/products.csv",   // caminho do CSV relativo à raiz do projeto
  delimiter: ",",                 // ou ";"
  columns: {                      // mapeie p/ os cabeçalhos do SEU CSV
    id: "id", name: "name", price: "price",
    image: "image", category: "category", stock: "stock", active: "active",
  },
}
```

A coluna **`id`** é a chave única — é por ela que as edições são casadas com as linhas do CSV. Se o seu CSV usa outro nome (ex. `sku`, `codigo`), basta apontar `id: "sku"`.

---

## 5. Módulo Pedidos — o contrato com a loja

O painel só **lê** pedidos; quem **grava** é o checkout da sua loja. Liga os dois assim:

**Ao gerar o pagamento** (criar PIX / iniciar cobrança), chame:

```ts
import { saveOrderSnapshot } from "@/lib/orders"

await saveOrderSnapshot(txid, {
  customer: { name, email, phone },
  address: { cep, street, number, complement, neighborhood, city, stateUF },
  items: [{ name, quantity, price }],
  total,
  gateway: "pagou", // opcional, livre
}, Date.now())
```

**Ao confirmar o pagamento** (polling no front OU webhook do gateway), chame:

```ts
import { markOrderPaid } from "@/lib/orders"
await markOrderPaid(txid)
```

- Pedido sem `markOrderPaid` em **30 min** vira **abandonado** (ajuste `ABANDONED_AFTER_MIN` em `lib/orders.ts`).
- Comprovante (opcional): `setOrderProofUrl(txid, url)` depois de subir o arquivo pra algum storage (ex. Vercel Blob).

**Contador de online (opcional):** na sua loja, mande um heartbeat periódico:

```ts
// num client component da loja, a cada ~20s, com um id de sessão estável:
fetch("/api/presence", { method: "POST", body: JSON.stringify({ id: sessionId }) })
```

---

## 6. Módulo Produtos — fluxo de edição

Pensado pra **serverless** (na Vercel o sistema de arquivos é só-leitura, então o CSV não é reescrito em runtime):

```
CSV no código  ──► (base, lida do disco)
                      │
                      ▼
              + overlay no KV  (suas edições/adições/remoções)
                      │
                      ▼
            tabela do painel (base mesclada com o overlay)
                      │
            [Exportar CSV] ──► baixa o products.csv final
                      │
            você commita o CSV no código  ──►  [Zerar overlay]
```

1. Edite/adicione/exclua produtos no painel → fica tudo no overlay (KV), sem tocar no arquivo.
2. Clique **Exportar CSV** → baixa o `products.csv` já mesclado.
3. Substitua o CSV do código por esse, faça commit e deploy.
4. Clique **Zerar overlay** → o overlay esvazia e o CSV volta a ser a única fonte.

Assim os produtos continuam "em CSV no código" (versionados), e o painel é só a ferramenta de edição.

---

## 7. Estrutura dos arquivos

```
admin.config.ts                         ← configuração central (edite aqui)
lib/
  admin-auth.ts    ← login por senha (cookie sha256), zero dependências
  kv.ts            ← cliente Upstash REST via fetch, sem dependência
  presence.ts      ← contador de online (sorted set no KV)
  orders.ts        ← ler/gravar pedidos (contrato com o checkout)
  catalog.ts       ← parser CSV + overlay KV + merge + export
app/admin/
  page.tsx         ← gate de auth + carrega dados (server)
  admin-shell.tsx  ← abas Pedidos | Produtos (client)
  admin-login.tsx  ← tela de senha
  orders-panel.tsx ← tabela/cards de pedidos
  products-panel.tsx ← tabela + editor de produtos
  online-count.tsx · logout-button.tsx
app/api/
  admin/login · admin/logout
  admin/products (GET/POST/DELETE) · admin/products/export · admin/products/reset
  presence (GET/POST)
data/products.example.csv               ← exemplo (troque pelo seu)
```

---

## 8. Limitações conhecidas

- **Sem KV não há edição de produtos nem listagem de pedidos** — são recursos que dependem do Upstash.
- O overlay de produtos **não some sozinho**: depois de exportar e commitar, use **Zerar overlay** pra não duplicar a fonte de verdade.
- Auth é **senha única** (suficiente pra painel de loja pequena). Pra multiusuário, troque `lib/admin-auth.ts`.
- O seletor de gateway (Pagou.ai/MedusaPay) da loja original **não** veio no kit por ser específico daquele projeto — o campo `gateway` aqui é só um rótulo livre exibido no pedido.
```
