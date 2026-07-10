import { Injectable } from '@angular/core'
import {
  AnalyticsPeriod,
  OrdersStatusAnalyticsResponse,
  RevenueAnalyticsResponse,
  RevenuePeriod,
  SalesByCategoryResponse,
  TopProductsResponse
} from '../../shared/interfaces/admin-analytics'
import { Observable } from 'rxjs'
import { ApiUrlService } from './api-url.service'

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService {
  constructor(private api: ApiUrlService) {}

  getRevenue(period: RevenuePeriod): Observable<RevenueAnalyticsResponse> {
    return this.api.get<RevenueAnalyticsResponse>(`/api/admin/analytics/revenue?period=${period}`)
  }

  getOrdersByStatus(): Observable<OrdersStatusAnalyticsResponse> {
    return this.api.get<OrdersStatusAnalyticsResponse>('/api/admin/analytics/orders-by-status')
  }

  getSalesByCategory(period: AnalyticsPeriod, limit = 10): Observable<SalesByCategoryResponse> {
    return this.api.get<SalesByCategoryResponse>(`/api/admin/analytics/sales-by-category?period=${period}&limit=${limit}`)
  }

  getTopProducts(period: AnalyticsPeriod, limit = 5): Observable<TopProductsResponse> {
    return this.api.get<TopProductsResponse>(`/api/admin/analytics/top-products?period=${period}&limit=${limit}`)
  }
}
