import { Product } from './product'

export interface CartItem {
  id?: number
  cart_id?: number
  product_id?: number
  product: Product
  quantity: number
  created_at?: string
  updated_at?: string
}

export interface Cart {
  id?: number
  user_id: number
  items: CartItem[]
  created_at?: string
  updated_at?: string
}
