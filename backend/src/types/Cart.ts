import { Product } from './Product'

export type Cart = {
  id?: number
  user_id: number
  items?: CartItem[]
}

export type CartItem = {
  id?: number
  cart_id?: number
  product_id: number
  product?: Product
  quantity: number
}
