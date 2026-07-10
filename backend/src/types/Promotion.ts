export type PromotionType = 'FIXED' | 'PERCENT'

export type Promotion = {
  id?: number
  name: string
  type: PromotionType
  value: number
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
