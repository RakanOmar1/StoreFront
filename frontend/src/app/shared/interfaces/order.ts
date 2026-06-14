export interface Order {
  id?: number
  user_id: number
  status: 'active' | 'complete'
}

export interface OrderItem {
  id?: number
  order_id: number
  product_id: number
  quantity: number
}
