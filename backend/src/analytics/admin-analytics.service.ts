import { AdminAnalyticsRepository } from './admin-analytics.repository'
import { OrdersStatusResponseDto, OrdersStatusPointDto } from './dto/orders-status-response.dto'
import { RevenuePeriod } from './dto/revenue-query.dto'
import { RevenueResponseDto, RevenuePointDto } from './dto/revenue-response.dto'
import { AnalyticsPeriod } from './dto/sales-category-query.dto'
import { SalesCategoryResponseDto } from './dto/sales-category-response.dto'
import { TopProductsResponseDto } from './dto/top-products-response.dto'

export class AnalyticsValidationError extends Error {}

type StatusKey = OrdersStatusPointDto['key']

interface RangeConfig {
  startDate: Date
  endDate: Date
  previousStartDate: Date
  previousEndDate: Date
  bucket: 'day' | 'month'
  bucketCount: number
}

export class AdminAnalyticsService {
  private repository = new AdminAnalyticsRepository()
  private excludedStatuses = ['CANCELLED']
  private excludedPayments = ['FAILED', 'REFUNDED']

  async revenue(periodParam?: string): Promise<RevenueResponseDto> {
    const period = this.revenuePeriod(periodParam)
    const range = this.revenueRange(period)
    const rows = await this.repository.revenue(range.bucket, range.startDate, range.endDate, this.excludedStatuses, this.excludedPayments)
    const previousRevenue = await this.repository.totalRevenue(range.previousStartDate, range.previousEndDate, this.excludedStatuses, this.excludedPayments)
    const revenueByBucket = new Map(rows.map(row => [this.bucketKeyFromSql(row.bucket_key, range.bucket), this.money(row.revenue)]))
    const points = this.buckets(range).map(bucket => ({
      label: this.label(bucket.startDate, range.bucket),
      startDate: this.dateOnly(bucket.startDate),
      endDate: this.dateOnly(this.addDays(bucket.endDate, -1)),
      revenue: revenueByBucket.get(this.bucketKey(bucket.startDate, range.bucket)) || 0
    }))
    const totalRevenue = this.roundMoney(points.reduce((total, point) => total + point.revenue, 0))

    return {
      period,
      currency: 'ILS',
      totalRevenue,
      growthPercentage: previousRevenue > 0
        ? this.roundPercent(((totalRevenue - previousRevenue) / previousRevenue) * 100)
        : 0,
      points
    }
  }

  async ordersByStatus(): Promise<OrdersStatusResponseDto> {
    const rows = await this.repository.ordersByStatus()
    const counts: Record<StatusKey, number> = {
      pending: 0,
      processing: 0,
      delivered: 0,
      cancelled: 0
    }

    rows.forEach(row => {
      counts[this.statusKey(row.status)] += Number(row.order_count) || 0
    })

    const totalOrders = Object.values(counts).reduce((total, count) => total + count, 0)
    const statuses: OrdersStatusPointDto[] = [
      this.statusPoint('Pending', 'pending', counts.pending, totalOrders),
      this.statusPoint('Processing', 'processing', counts.processing, totalOrders),
      this.statusPoint('Delivered', 'delivered', counts.delivered, totalOrders),
      this.statusPoint('Cancelled', 'cancelled', counts.cancelled, totalOrders)
    ]

    return { totalOrders, statuses }
  }

  async salesByCategory(periodParam?: string, limitParam?: string): Promise<SalesCategoryResponseDto> {
    const period = this.analyticsPeriod(periodParam)
    const limit = this.limit(limitParam, 10)
    const range = this.analyticsRange(period)
    const rows = await this.repository.salesByCategory(range.startDate, range.endDate, limit, this.excludedStatuses, this.excludedPayments)

    return {
      period,
      currency: 'ILS',
      categories: rows.map(row => ({
        categoryId: row.category_id === null ? null : Number(row.category_id),
        categoryName: row.category_name || 'Uncategorized',
        revenue: this.money(row.revenue),
        unitsSold: Number(row.units_sold) || 0
      }))
    }
  }

  async topProducts(periodParam?: string, limitParam?: string): Promise<TopProductsResponseDto> {
    const period = this.analyticsPeriod(periodParam)
    const limit = this.limit(limitParam, 5)
    const range = this.analyticsRange(period)
    const rows = await this.repository.topProducts(range.startDate, range.endDate, limit, this.excludedStatuses, this.excludedPayments)

    return {
      period,
      products: rows.map(row => ({
        productId: row.product_id === null ? null : Number(row.product_id),
        productName: row.product_name || 'Deleted product',
        unitsSold: Number(row.units_sold) || 0,
        revenue: this.money(row.revenue)
      }))
    }
  }

  private revenuePeriod(value?: string): RevenuePeriod {
    const period = value || '6m'
    if (period === '7d' || period === '30d' || period === '6m' || period === '1y') {
      return period
    }
    throw new AnalyticsValidationError('Unsupported revenue period')
  }

  private analyticsPeriod(value?: string): AnalyticsPeriod {
    const period = value || '6m'
    if (period === '30d' || period === '6m' || period === '1y') {
      return period
    }
    throw new AnalyticsValidationError('Unsupported analytics period')
  }

  private limit(value: string | undefined, defaultLimit: number): number {
    if (!value) {
      return defaultLimit
    }

    const limit = Number(value)
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
      throw new AnalyticsValidationError('Limit must be an integer from 1 to 20')
    }

    return limit
  }

  private revenueRange(period: RevenuePeriod): RangeConfig {
    const now = new Date()
    if (period === '7d' || period === '30d') {
      return this.dayRange(period === '7d' ? 7 : 30, now)
    }

    return this.monthRange(period === '6m' ? 6 : 12, now)
  }

  private analyticsRange(period: AnalyticsPeriod): RangeConfig {
    const now = new Date()
    if (period === '30d') {
      return this.dayRange(30, now)
    }

    return this.monthRange(period === '6m' ? 6 : 12, now)
  }

  private dayRange(days: number, now: Date): RangeConfig {
    const endDate = this.startOfDay(this.addDays(now, 1))
    const startDate = this.addDays(endDate, -days)
    const previousStartDate = this.addDays(startDate, -days)

    return {
      startDate,
      endDate,
      previousStartDate,
      previousEndDate: startDate,
      bucket: 'day',
      bucketCount: days
    }
  }

  private monthRange(months: number, now: Date): RangeConfig {
    const endDate = this.addMonths(this.startOfMonth(now), 1)
    const startDate = this.addMonths(endDate, -months)
    const previousStartDate = this.addMonths(startDate, -months)

    return {
      startDate,
      endDate,
      previousStartDate,
      previousEndDate: startDate,
      bucket: 'month',
      bucketCount: months
    }
  }

  private buckets(range: RangeConfig): Array<{ startDate: Date; endDate: Date }> {
    const buckets: Array<{ startDate: Date; endDate: Date }> = []

    for (let index = 0; index < range.bucketCount; index += 1) {
      const startDate = range.bucket === 'month'
        ? this.addMonths(range.startDate, index)
        : this.addDays(range.startDate, index)
      const endDate = range.bucket === 'month'
        ? this.addMonths(startDate, 1)
        : this.addDays(startDate, 1)

      buckets.push({ startDate, endDate })
    }

    return buckets
  }

  private statusPoint(status: string, key: StatusKey, count: number, totalOrders: number): OrdersStatusPointDto {
    return {
      status,
      key,
      count,
      percentage: totalOrders > 0 ? this.roundPercent((count / totalOrders) * 100) : 0
    }
  }

  private statusKey(status: string): StatusKey {
    const normalized = String(status || '').toUpperCase()
    if (normalized === 'DELIVERED' || normalized === 'COMPLETE') {
      return 'delivered'
    }
    if (normalized === 'CANCELLED') {
      return 'cancelled'
    }
    if (normalized === 'CONFIRMED' || normalized === 'PREPARING' || normalized === 'OUT_FOR_DELIVERY') {
      return 'processing'
    }
    return 'pending'
  }

  private label(date: Date, bucket: 'day' | 'month'): string {
    return bucket === 'month'
      ? date.toLocaleDateString('en-US', { month: 'short' })
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  private bucketKey(date: Date, bucket: 'day' | 'month'): string {
    return bucket === 'month'
      ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
      : this.dateOnly(date)
  }

  private bucketKeyFromSql(value: string, bucket: 'day' | 'month'): string {
    return bucket === 'month' ? value.slice(0, 7) : value.slice(0, 10)
  }

  private dateOnly(date: Date): string {
    return date.toISOString().slice(0, 10)
  }

  private startOfDay(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  }

  private startOfMonth(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date)
    next.setUTCDate(next.getUTCDate() + days)
    return next
  }

  private addMonths(date: Date, months: number): Date {
    const next = new Date(date)
    next.setUTCMonth(next.getUTCMonth() + months)
    return next
  }

  private money(value: string | number): number {
    return this.roundMoney(Number(value) || 0)
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100
  }

  private roundPercent(value: number): number {
    return Math.round(value * 100) / 100
  }
}
