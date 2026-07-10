import { AnalyticsPeriod } from './sales-category-query.dto'

export interface SalesCategoryPointDto {
  categoryId: number | null
  categoryName: string
  revenue: number
  unitsSold: number
}

export interface SalesCategoryResponseDto {
  period: AnalyticsPeriod
  currency: 'ILS'
  categories: SalesCategoryPointDto[]
}
