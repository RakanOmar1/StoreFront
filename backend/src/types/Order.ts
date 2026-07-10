export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'active' | 'complete'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
export type PaymentMethod = 'CASH' | 'ONLINE'
export type DeliveryType = 'PICKUP' | 'DELIVERY'

export type Order = {
  id?: number
  user_id: number
  total_amount?: number
  status: OrderStatus
  payment_status?: PaymentStatus
  payment_method?: PaymentMethod
  delivery_type?: DeliveryType
  delivery_address?: string | null
  items?: OrderProduct[]
}

export type OrderProduct = {
  id?: number
  order_id: number
  product_id: number
  quantity: number
  price?: number
}

export type CheckoutPayload = {
  paymentMethod: PaymentMethod
  deliveryType: DeliveryType
  deliveryAddress?: string
}
