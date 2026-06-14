export type OrderStatus = 'active' | 'complete'

export type Order = {
  id?: number
  user_id: number
  status: OrderStatus
}

export type OrderProduct = {
  id?: number
  order_id: number
  product_id: number
  quantity: number
}
