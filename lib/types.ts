export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  category: string
  badge?: string
  stock?: number
  minQuantity?: number
  includes?: string[]
  accompaniments?: string[]
}

export interface Additional {
  id: string
  name: string
  quantity: string
  price: number
  freeOnFirstOrder?: boolean
}

export interface CartItem {
  product: Product
  quantity: number
  additionals: { additional: Additional; quantity: number }[]
  observation: string
  isCombo?: boolean
  comboPrice?: number
  comboItems?: {
    destilados: { product: Product; qty: number }[]
    gelos: { product: Product; qty: number }[]
    energeticos: { product: Product; qty: number }[]
  }
}

export interface Review {
  id: string
  name: string
  rating: number
  comment: string
  date: string
}

export interface Category {
  id: string
  name: string
  icon: string
  /** Oculta a coleção (e os produtos dela) da home, das abas, da busca e das sugestões. */
  hidden?: boolean
  /** Oferece o adicional grátis do 1º pedido (gelo, copos…) no detalhe do produto. */
  brindeGratis?: boolean
}
