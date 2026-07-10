import { AnalyticsPeriod } from './sales-category-query.dto'

export interface TopProductPointDto {
  productId: number | null
  productName: string
  unitsSold: number
  revenue: number
}

export interface TopProductsResponseDto {
  period: AnalyticsPeriod
  products: TopProductPointDto[]
}
