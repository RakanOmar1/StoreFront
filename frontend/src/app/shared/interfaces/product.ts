export interface Category {
  id: number
  name: string
  description?: string | null
  created_at?: string
  updated_at?: string
}

export interface Brand {
  id: number
  name: string
  description?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface Promotion {
  id: number
  name: string
  type: 'FIXED' | 'PERCENT' | 'BUNDLE'
  value: number
  bundle_quantity?: number | null
  bundle_price?: number | null
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
  brand_id?: number | null
  brand?: string | null
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
