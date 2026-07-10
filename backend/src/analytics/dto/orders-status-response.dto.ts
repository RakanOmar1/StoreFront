export interface OrdersStatusPointDto {
  status: string
  key: 'pending' | 'processing' | 'delivered' | 'cancelled'
  count: number
  percentage: number
}

export interface OrdersStatusResponseDto {
  totalOrders: number
  statuses: OrdersStatusPointDto[]
}
