import type { Additional, Category, Product, Review } from "./types"
import { docesCategories, docesProducts } from "./data-doces"

/** Produto de teste: fica fora das abas, só aparece na busca ("teste") e pode
 *  furar o pedido mínimo — serve pra validar o checkout com R$ 5. */
const produtoDeTeste: Product = {
  id: "teste-5",
  name: "Produto de Teste R$ 5",
  description: 'Item de teste para validar o checkout. Pesquise por "teste".',
  price: 5.0,
  image: "/placeholder.svg",
  category: "teste",
  badge: "TESTE",
  stock: 999,
  includes: ["1 unidade"],
  accompaniments: [],
}

/** Adicionais do pedido. Vazio: a lista antiga (gelo, copos, limão) era da loja
 *  de bebidas. Com a lista vazia, a seção some sozinha no detalhe do produto. */
export const additionals: Additional[] = []

/** Preferências grátis por prato (estilo iFood), por id de produto. Vazio: eram
 *  dos pratos da loja antiga. É só preencher quando a doceria quiser usar. */
export const foodAdditionals: Record<string, Additional[]> = {}

/** Avaliações: só entram quando forem de clientes de verdade. */
export const reviews: Review[] = []

/** Coleções da loja, na ordem das abas. A primeira é a aba inicial da home. */
export const allCategories: Category[] = docesCategories

/** Coleções visíveis (uma coleção com `hidden: true` some da home, das abas,
 *  da busca e das sugestões — junto com os produtos dela). */
export const categories = allCategories.filter((c) => !c.hidden)

export const HOME_CATEGORY_ID = categories[0]?.id ?? ""

const colecoesVisiveis = new Set(categories.map((c) => c.id))

/** Produtos à venda: só os de coleção visível, mais o de teste. */
export const products: Product[] = [...docesProducts, produtoDeTeste].filter(
  (p) => colecoesVisiveis.has(p.category) || p.category === "teste",
)
