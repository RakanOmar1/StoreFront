import { CommonModule } from '@angular/common'
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core'
import { Subscription } from 'rxjs'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { DropdownModule } from 'primeng/dropdown'
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip
} from 'chart.js'
import { finalize, timeout } from 'rxjs/operators'
import { AdminAnalyticsService } from '../../core/services/admin-analytics.service'
import { TranslatePipe } from '../../core/i18n/translate.pipe'
import { TranslationService } from '../../core/i18n/translation.service'
import { SelectOption } from '../../shared/interfaces/select-option'
import {
  AnalyticsPeriod,
  OrdersStatusAnalyticsResponse,
  RevenueAnalyticsResponse,
  RevenuePeriod,
  SalesByCategoryResponse,
  TopProductsResponse
} from '../../shared/interfaces/admin-analytics'

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip
)

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="analytics-section">
      <div class="analytics-heading">
        <div>
          <span class="section-label">{{ 'admin.analytics' | t }}</span>
          <h2>{{ 'admin.analyticsOverview' | t }}</h2>
        </div>
      </div>

      <div class="analytics-primary-grid">
        <article class="chart-card revenue-chart-card">
          <div class="chart-card-header">
            <div>
              <h3 class="chart-card-title">{{ 'admin.revenueOverview' | t }}</h3>
              <p class="chart-card-subtitle">{{ 'admin.revenueSubtitle' | t }}</p>
            </div>
            <div class="chart-header-actions">
              <div class="chart-summary">
                <span>{{ 'admin.totalRevenue' | t }}</span>
                <strong>{{ money(revenueData?.totalRevenue || 0) }}</strong>
              </div>
              <div class="chart-summary">
                <span>{{ 'admin.growth' | t }}</span>
                <strong [class.negative]="(revenueData?.growthPercentage || 0) < 0">{{ percent(revenueData?.growthPercentage || 0) }}</strong>
              </div>
              <label class="chart-period-select">
                <span>{{ 'admin.period' | t }}</span>
                <p-dropdown
                  [ngModel]="selectedRevenuePeriod"
                  [options]="revenuePeriodOptions"
                  optionLabel="label"
                  optionValue="value"
                  [placeholder]="'admin.selectPeriod' | t"
                  appendTo="body"
                  styleClass="app-dropdown"
                  (ngModelChange)="changeRevenuePeriod($event)"
                />
              </label>
            </div>
          </div>

          <div class="chart-state" *ngIf="revenueLoading">{{ 'admin.loadingRevenue' | t }}</div>
          <div class="chart-state error" *ngIf="!revenueLoading && revenueError">
            <span>{{ revenueError | t }}</span>
            <button type="button" (click)="loadRevenue()">{{ 'common.retry' | t }}</button>
          </div>
          <div class="chart-state" *ngIf="!revenueLoading && !revenueError && revenueData && !revenueData.totalRevenue">{{ 'admin.noRevenueData' | t }}</div>
          <div class="chart-container" [class.is-hidden]="revenueLoading || revenueError || !revenueData?.totalRevenue">
              <canvas #revenueCanvas [attr.aria-label]="'admin.revenueChartLabel' | t"></canvas>
          </div>
        </article>

        <article class="chart-card order-status-chart-card">
          <div class="chart-card-header">
            <div>
              <h3 class="chart-card-title">{{ 'admin.ordersByStatus' | t }}</h3>
              <p class="chart-card-subtitle">{{ 'admin.orderDistribution' | t }}</p>
            </div>
          </div>

          <div class="chart-state" *ngIf="ordersStatusLoading">{{ 'admin.loadingOrders' | t }}</div>
          <div class="chart-state error" *ngIf="!ordersStatusLoading && ordersStatusError">
            <span>{{ ordersStatusError | t }}</span>
            <button type="button" (click)="loadOrdersByStatus()">{{ 'common.retry' | t }}</button>
          </div>
          <div class="chart-state" *ngIf="!ordersStatusLoading && !ordersStatusError && ordersStatusData && !ordersStatusData.totalOrders">{{ 'admin.noOrders' | t }}</div>
          <div class="donut-chart-layout" *ngIf="!ordersStatusLoading && !ordersStatusError && ordersStatusData?.totalOrders">
            <div class="donut-wrap">
              <canvas #statusCanvas [attr.aria-label]="'admin.ordersChartLabel' | t"></canvas>
              <div class="donut-center">
                <strong>{{ ordersStatusData?.totalOrders || 0 }}</strong>
                <span>{{ 'admin.orders' | t }}</span>
              </div>
            </div>
            <div class="status-legend">
              <div *ngFor="let item of ordersStatusData?.statuses || []">
                <span class="legend-dot" [style.background]="statusColor(item.key)"></span>
                <strong>{{ item.status }}</strong>
                <span>{{ item.count }}</span>
                <small>{{ item.percentage }}%</small>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div class="analytics-secondary-grid">
        <article class="chart-card category-chart-card">
          <div class="chart-card-header">
            <div>
              <h3 class="chart-card-title">{{ 'admin.salesByCategory' | t }}</h3>
              <p class="chart-card-subtitle">{{ 'admin.salesByCategorySubtitle' | t }}</p>
            </div>
          </div>

          <div class="chart-state" *ngIf="categorySalesLoading">{{ 'admin.loadingCategories' | t }}</div>
          <div class="chart-state error" *ngIf="!categorySalesLoading && categorySalesError">
            <span>{{ categorySalesError | t }}</span>
            <button type="button" (click)="loadSalesByCategory()">{{ 'common.retry' | t }}</button>
          </div>
          <div class="chart-state" *ngIf="!categorySalesLoading && !categorySalesError && categorySalesData && !categorySalesData.categories.length">{{ 'admin.noCategorySales' | t }}</div>
          <div class="chart-container" [class.is-hidden]="categorySalesLoading || categorySalesError || !categorySalesData?.categories?.length">
            <canvas #categoryCanvas [attr.aria-label]="'admin.categoryChartLabel' | t"></canvas>
          </div>
        </article>

        <article class="chart-card products-chart-card">
          <div class="chart-card-header">
            <div>
              <h3 class="chart-card-title">{{ 'admin.topProducts' | t }}</h3>
              <p class="chart-card-subtitle">{{ 'admin.topProductsSubtitle' | t }}</p>
            </div>
          </div>

          <div class="chart-state" *ngIf="topProductsLoading">{{ 'admin.loadingProducts' | t }}</div>
          <div class="chart-state error" *ngIf="!topProductsLoading && topProductsError">
            <span>{{ topProductsError | t }}</span>
            <button type="button" (click)="loadTopProducts()">{{ 'common.retry' | t }}</button>
          </div>
          <div class="chart-state" *ngIf="!topProductsLoading && !topProductsError && topProductsData && !topProductsData.products.length">{{ 'admin.noProductSales' | t }}</div>
          <div class="chart-container" [class.is-hidden]="topProductsLoading || topProductsError || !topProductsData?.products?.length">
            <canvas #productsCanvas [attr.aria-label]="'admin.productsChartLabel' | t"></canvas>
          </div>
        </article>
      </div>
    </section>
  `
})
export class AdminAnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('revenueCanvas') revenueCanvas?: ElementRef<HTMLCanvasElement>
  @ViewChild('statusCanvas') statusCanvas?: ElementRef<HTMLCanvasElement>
  @ViewChild('categoryCanvas') categoryCanvas?: ElementRef<HTMLCanvasElement>
  @ViewChild('productsCanvas') productsCanvas?: ElementRef<HTMLCanvasElement>

  revenueLoading = false
  revenueError = ''
  revenueData: RevenueAnalyticsResponse | null = null
  selectedRevenuePeriod: RevenuePeriod = '6m'
  revenuePeriodOptions: SelectOption<RevenuePeriod>[] = []

  ordersStatusLoading = false
  ordersStatusError = ''
  ordersStatusData: OrdersStatusAnalyticsResponse | null = null

  categorySalesLoading = false
  categorySalesError = ''
  categorySalesData: SalesByCategoryResponse | null = null
  selectedCategoryPeriod: AnalyticsPeriod = '6m'

  topProductsLoading = false
  topProductsError = ''
  topProductsData: TopProductsResponse | null = null
  selectedTopProductsPeriod: AnalyticsPeriod = '6m'

  private viewReady = false
  private revenueChart?: Chart
  private statusChart?: Chart
  private categoryChart?: Chart
  private productsChart?: Chart
  private destroyRef = inject(DestroyRef)
  private languageSub?: Subscription

  constructor(
    private analytics: AdminAnalyticsService,
    private cdr: ChangeDetectorRef,
    private translations: TranslationService
  ) {
    this.setRevenuePeriodOptions()
    this.languageSub = this.translations.language$.subscribe(() => {
      this.setRevenuePeriodOptions()
      this.renderAllCharts()
      this.cdr.markForCheck()
    })
  }

  ngOnInit(): void {
    this.loadRevenue()
    this.loadOrdersByStatus()
    this.loadSalesByCategory()
    this.loadTopProducts()
  }

  ngAfterViewInit(): void {
    this.viewReady = true
    this.renderAllCharts()
  }

  ngOnDestroy(): void {
    this.languageSub?.unsubscribe()
    this.destroyCharts()
  }

  loadRevenue(): void {
    if (this.revenueLoading) return
    this.revenueLoading = true
    this.revenueError = ''
    this.revenueChart?.destroy()

    this.analytics.getRevenue(this.selectedRevenuePeriod).pipe(
      timeout(10000),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.revenueLoading = false
        this.cdr.markForCheck()
      })
    ).subscribe({
      next: response => {
        this.revenueData = response
        this.cdr.detectChanges()
        this.renderRevenueChart()
      },
      error: () => {
        this.revenueData = null
        this.revenueError = 'admin.loadRevenueAnalyticsError'
      }
    })
  }

  loadOrdersByStatus(): void {
    if (this.ordersStatusLoading) return
    this.ordersStatusLoading = true
    this.ordersStatusError = ''
    this.statusChart?.destroy()

    this.analytics.getOrdersByStatus().pipe(
      timeout(10000),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.ordersStatusLoading = false
        this.cdr.markForCheck()
      })
    ).subscribe({
      next: response => {
        this.ordersStatusData = response
        this.cdr.detectChanges()
        this.renderStatusChart()
      },
      error: () => {
        this.ordersStatusData = null
        this.ordersStatusError = 'admin.loadOrderStatusAnalyticsError'
      }
    })
  }

  loadSalesByCategory(): void {
    if (this.categorySalesLoading) return
    this.categorySalesLoading = true
    this.categorySalesError = ''
    this.categoryChart?.destroy()

    this.analytics.getSalesByCategory(this.selectedCategoryPeriod, 10).pipe(
      timeout(10000),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.categorySalesLoading = false
        this.cdr.markForCheck()
      })
    ).subscribe({
      next: response => {
        this.categorySalesData = response
        this.cdr.detectChanges()
        this.renderCategoryChart()
      },
      error: () => {
        this.categorySalesData = null
        this.categorySalesError = 'admin.loadCategorySalesAnalyticsError'
      }
    })
  }

  loadTopProducts(): void {
    if (this.topProductsLoading) return
    this.topProductsLoading = true
    this.topProductsError = ''
    this.productsChart?.destroy()

    this.analytics.getTopProducts(this.selectedTopProductsPeriod, 5).pipe(
      timeout(10000),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.topProductsLoading = false
        this.cdr.markForCheck()
      })
    ).subscribe({
      next: response => {
        this.topProductsData = response
        this.cdr.detectChanges()
        this.renderProductsChart()
      },
      error: () => {
        this.topProductsData = null
        this.topProductsError = 'admin.loadTopProductsAnalyticsError'
      }
    })
  }

  changeRevenuePeriod(period: RevenuePeriod): void {
    if (period === this.selectedRevenuePeriod) return
    this.selectedRevenuePeriod = period
    this.loadRevenue()
  }

  statusColor(key: string): string {
    return {
      pending: '#d98435',
      processing: '#071d3a',
      delivered: '#e10613',
      cancelled: '#dc7b70'
    }[key] || '#697386'
  }

  money(value: number): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0
    }).format(Number(value || 0))
  }

  percent(value: number): string {
    const sign = value > 0 ? '+' : ''
    return `${sign}${Number(value || 0).toFixed(1)}%`
  }

  private renderAllCharts(): void {
    this.renderRevenueChart()
    this.renderStatusChart()
    this.renderCategoryChart()
    this.renderProductsChart()
  }

  private renderRevenueChart(): void {
    this.revenueChart?.destroy()
    if (!this.viewReady || !this.revenueCanvas || !this.revenueData?.totalRevenue) return
    const ctx = this.revenueCanvas.nativeElement.getContext('2d')
    if (!ctx) return
    const gradient = ctx.createLinearGradient(0, 0, 0, 280)
    gradient.addColorStop(0, 'rgba(225, 6, 19, 0.24)')
    gradient.addColorStop(1, 'rgba(225, 6, 19, 0)')

    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.revenueData.points.map(point => point.label),
        datasets: [{
          data: this.revenueData.points.map(point => point.revenue),
          borderColor: '#e10613',
          backgroundColor: gradient,
          fill: true,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#e10613',
          pointBorderWidth: 2,
          pointRadius: 4,
          tension: 0.42
        }]
      },
      options: this.baseOptions(this.translations.translate('admin.revenue'), value => this.money(Number(value)))
    })
  }

  private renderStatusChart(): void {
    this.statusChart?.destroy()
    if (!this.viewReady || !this.statusCanvas || !this.ordersStatusData?.totalOrders) return

    this.statusChart = new Chart(this.statusCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.ordersStatusData.statuses.map(item => item.status),
        datasets: [{
          data: this.ordersStatusData.statuses.map(item => item.count),
          backgroundColor: this.ordersStatusData.statuses.map(item => this.statusColor(item.key)),
          borderColor: '#ffffff',
          borderWidth: 4,
          hoverOffset: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: context => `${context.label}: ${context.parsed} (${this.ordersStatusData?.statuses[context.dataIndex]?.percentage || 0}%)`
            }
          }
        }
      }
    })
  }

  private renderCategoryChart(): void {
    this.categoryChart?.destroy()
    if (!this.viewReady || !this.categoryCanvas || !this.categorySalesData?.categories.length) return

    this.categoryChart = new Chart(this.categoryCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.categorySalesData.categories.map(item => this.truncate(item.categoryName, 18)),
        datasets: [{
          data: this.categorySalesData.categories.map(item => item.revenue),
          backgroundColor: '#071d3a',
          borderRadius: 9,
          maxBarThickness: 42
        }]
      },
      options: this.baseOptions(this.translations.translate('admin.sales'), value => this.money(Number(value)))
    })
  }

  private renderProductsChart(): void {
    this.productsChart?.destroy()
    if (!this.viewReady || !this.productsCanvas || !this.topProductsData?.products.length) return

    this.productsChart = new Chart(this.productsCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.topProductsData.products.map(item => this.truncate(item.productName, 24)),
        datasets: [{
          data: this.topProductsData.products.map(item => item.unitsSold),
          backgroundColor: '#071d3a',
          borderRadius: 9,
          maxBarThickness: 30
        }]
      },
      options: {
        ...this.baseOptions(this.translations.translate('admin.unitsSoldLabel'), value => this.translations.translate('admin.unitsCount', { count: value })),
        indexAxis: 'y'
      }
    })
  }

  private setRevenuePeriodOptions(): void {
    this.revenuePeriodOptions = [
      { value: '7d', label: this.translations.translate('admin.period7Days') },
      { value: '30d', label: this.translations.translate('admin.period30Days') },
      { value: '6m', label: this.translations.translate('admin.period6Months') },
      { value: '1y', label: this.translations.translate('admin.period1Year') }
    ]
  }

  private baseOptions(label: string, formatter: (value: string | number) => string) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => `${label}: ${formatter(context.parsed?.y ?? context.parsed?.x ?? context.parsed)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#667085', maxRotation: 0, autoSkip: true }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(228, 231, 235, 0.72)' },
          ticks: {
            color: '#667085',
            callback: (value: string | number) => formatter(value)
          }
        }
      }
    } as any
  }

  private truncate(value: string, maxLength: number): string {
    return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value
  }

  private destroyCharts(): void {
    this.revenueChart?.destroy()
    this.statusChart?.destroy()
    this.categoryChart?.destroy()
    this.productsChart?.destroy()
  }
}



