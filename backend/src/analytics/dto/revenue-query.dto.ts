export type RevenuePeriod = '7d' | '30d' | '6m' | '1y'

export interface RevenueQueryDto {
  period: RevenuePeriod
}
