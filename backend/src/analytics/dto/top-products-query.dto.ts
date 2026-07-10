import { AnalyticsPeriod } from './sales-category-query.dto'

export interface TopProductsQueryDto {
  period: AnalyticsPeriod
  limit: number
}
