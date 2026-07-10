export type RevenuePeriod = '7d' | '30d' | '6m' | '1y'
export type AnalyticsPeriod = '30d' | '6m' | '1y'

export interface RevenueAnalyticsPoint {
  label: string
  startDate: string
  endDate: string
  revenue: number
}

export interface RevenueAnalyticsResponse {
  period: RevenuePeriod
  currency: 'ILS'
  totalRevenue: number
  growthPercentage: number
  points: RevenueAnalyticsPoint[]
}

export interface OrdersStatusAnalyticsPoint {
  status: string
  key: 'pending' | 'processing' | 'delivered' | 'cancelled'
  count: number
  percentage: number
}

export interface OrdersStatusAnalyticsResponse {
  totalOrders: number
  statuses: OrdersStatusAnalyticsPoint[]
}

export interface SalesByCategoryPoint {
  categoryId: number | null
  categoryName: string
  revenue: number
  unitsSold: number
}

export interface SalesByCategoryResponse {
  period: AnalyticsPeriod
  currency: 'ILS'
  categories: SalesByCategoryPoint[]
}

export interface TopProductPoint {
  productId: number | null
  productName: string
  unitsSold: number
  revenue: number
}

export interface TopProductsResponse {
  period: AnalyticsPeriod
  products: TopProductPoint[]
}
