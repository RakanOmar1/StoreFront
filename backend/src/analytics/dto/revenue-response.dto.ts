import { RevenuePeriod } from './revenue-query.dto'

export interface RevenuePointDto {
  label: string
  startDate: string
  endDate: string
  revenue: number
}

export interface RevenueResponseDto {
  period: RevenuePeriod
  currency: 'ILS'
  totalRevenue: number
  growthPercentage: number
  points: RevenuePointDto[]
}
