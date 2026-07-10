export type Product = {
  id?: number
  name: string
  price: number
  description?: string | null
  url?: string | null
  images?: string[] | null
  category?: string | null
  category_id?: number | null
  promotion_id?: number | null
  promotion?: {
    id: number
    name: string
    type: 'FIXED' | 'PERCENT'
    value: number
    is_active: boolean
  } | null
  finalPrice?: number
  final_price?: number
  created_at?: Date
  updated_at?: Date
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
