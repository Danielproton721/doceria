// ============================================================================
//  admin-kit · CONFIGURAÇÃO CENTRAL
//  Este é o ÚNICO arquivo que você precisa editar pra plugar o painel numa
//  loja nova. Marca, cookie, módulos ligados/desligados e o mapeamento do CSV
//  de produtos ficam todos aqui.
// ============================================================================

export const adminConfig = {
  // Nome que aparece no título do painel e na tela de login.
  brand: "Minha Loja",

  // Nome do cookie de sessão do admin. Troque por loja pra não colidir cookies
  // se você rodar várias lojas no mesmo domínio/subdomínio.
  cookieName: "ak_admin",

  // Liga/desliga cada aba do painel. Pedidos exige KV + checkout gravando lá.
  // Produtos exige um CSV (veja `catalog` abaixo).
  modules: {
    orders: true,
    products: true,
  },

  // ------------------------------------------------------------------------
  //  CATÁLOGO (módulo Produtos)
  //  O CSV é a FONTE BASE (lido do disco). Edições feitas no painel ficam num
  //  overlay no KV e são mescladas na leitura. O botão "Exportar CSV" gera o
  //  arquivo final mesclado pra você baixar e commitar de volta no código.
  // ------------------------------------------------------------------------
  catalog: {
    // Caminho do CSV RELATIVO À RAIZ do projeto da loja (process.cwd()).
    // Ex.: "data/products.csv" ou "lib/catalog/products.csv".
    csvPath: "data/products.example.csv",

    // Delimitador do CSV. Vírgula é o padrão; troque por ";" se for o caso.
    delimiter: ",",

    // Mapeamento de colunas: qual cabeçalho do SEU CSV corresponde a cada
    // campo lógico. A coluna `id` é a CHAVE única usada pra mesclar edições.
    // Renomeie os valores à direita pra bater com os cabeçalhos do seu arquivo.
    columns: {
      id: "id",
      name: "name",
      price: "price",
      image: "image",
      category: "category",
      stock: "stock",
      active: "active",
    } as Record<string, string>,
  },
} as const

export type AdminConfig = typeof adminConfig
