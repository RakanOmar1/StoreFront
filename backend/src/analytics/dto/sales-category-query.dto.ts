export type AnalyticsPeriod = '30d' | '6m' | '1y'

export interface SalesCategoryQueryDto {
  period: AnalyticsPeriod
  limit: number
}
