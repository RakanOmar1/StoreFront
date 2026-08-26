export type PromotionType = 'FIXED' | 'PERCENT' | 'BUNDLE'

export type Promotion = {
  id?: number
  name: string
  type: PromotionType
  value: number
  bundle_quantity?: number | null
  bundle_price?: number | null
  is_active?: boolean
  productIds?: number[]
  categoryIds?: number[]
  products?: Array<{
    id: number
    name: string
    price?: number
    category?: string | null
    category_id?: number | null
    url?: string | null
  }>
}
