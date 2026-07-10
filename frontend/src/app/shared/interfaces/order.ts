export interface Order {
  id?: number
  user_id: number
  total_amount?: number
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'active' | 'complete'
  payment_status?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  payment_method?: 'CASH' | 'ONLINE'
  delivery_type?: 'PICKUP' | 'DELIVERY'
  delivery_address?: string | null
  items?: OrderItem[]
  created_at?: string
  updated_at?: string
}

export interface OrderItem {
  id?: number
  order_id: number
  product_id: number
  quantity: number
  price?: number
  created_at?: string
  updated_at?: string
}

export interface CheckoutPayload {
  paymentMethod: 'CASH' | 'ONLINE'
  deliveryType: 'PICKUP' | 'DELIVERY'
  deliveryAddress?: string
}

export interface CheckoutResponse {
  message: string
  order: Order
}
