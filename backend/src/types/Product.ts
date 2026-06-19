export type Product = {
  id?: number
  name: string
  price: number
  category?: string
}

export type ProductQuery = {
  search?: string
  category?: string
  maxPrice?: number
  limit?: number
  offset?: number
}

export type ProductFilters = {
  categories: string[]
  maxPrice: number
}
