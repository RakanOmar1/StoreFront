export interface Category {
  id: number
  name: string
  description?: string | null
  created_at?: string
  updated_at?: string
}

export interface Promotion {
  id: number
  name: string
  type: 'FIXED' | 'PERCENT'
  value: number
  is_active?: boolean
  productIds?: number[]
  categoryIds?: number[]
  products?: Product[]
}

export interface Product {
  id: number
  name: string
  price: number
  finalPrice?: number
  category?: string | null
  category_id?: number | null
  promotion_id?: number | null
  promotion?: Promotion | null
  sku?: string | null
  barcode?: string | null
  status?: string | null
  is_active?: boolean | null
  url: string
  images?: string[]
  description: string
  created_at?: string
  updated_at?: string
}
