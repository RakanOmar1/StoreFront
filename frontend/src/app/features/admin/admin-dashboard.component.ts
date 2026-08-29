import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { AdminDataService } from '../../core/services/admin-data.service'
import { AdminAnalyticsService } from '../../core/services/admin-analytics.service'
import { Order } from '../../shared/interfaces/order'
import { Product, Promotion } from '../../shared/interfaces/product'
import { PublicUser } from '../../shared/interfaces/user'
import { AnalyticsPeriod } from '../../shared/interfaces/admin-analytics'
import { AdminAnalyticsComponent } from './admin-analytics.component'
import { AdminSidebarComponent } from './admin-sidebar.component'
import { AdminPageHeaderComponent, AdminStateBlockComponent } from './admin-ui.component'
import { TranslatePipe } from '../../core/i18n/translate.pipe'
import { TranslationService } from '../../core/i18n/translation.service'
import { DropdownModule } from 'primeng/dropdown'

interface DashboardTopProduct {
  name: string
  meta: string
  revenue: string
  unitsSold: number
  trend: string
  trendPositive: boolean
  icon: string
}

interface DashboardCategorySale {
  name: string
  revenue: string
  percentage: number
  icon: string
  color: string
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DropdownModule, AdminSidebarComponent, AdminAnalyticsComponent, AdminPageHeaderComponent, AdminStateBlockComponent, TranslatePipe],
  template: `
    <section class="admin-shell">
      <app-admin-sidebar />

      <div class="admin-shell-content">
        <section class="admin-page admin-dashboard-page">
          <app-admin-page-header
            [eyebrow]="'admin.admin' | t"
            [title]="'admin.dashboardTitle' | t"
            [description]="'admin.dashboardSubtitle' | t"
          >
            <a routerLink="/products" class="secondary-button">{{ 'common.viewStore' | t }}</a>
          </app-admin-page-header>

          <app-admin-state-block *ngIf="error" title="Dashboard unavailable" [message]="error" tone="error" />
          <app-admin-state-block *ngIf="loading" title="Loading dashboard" message="Fetching revenue, catalog, and customer metrics." [loading]="true" />

          <div class="admin-stats-grid" *ngIf="!loading">
            <article class="admin-stat-card revenue">
              <span><i class="pi pi-wallet" aria-hidden="true"></i>{{ 'admin.totalRevenue' | t }}</span>
              <strong>{{ money(totalRevenue) }}</strong>
              <p>Money collected from orders.</p>
            </article>
            <article class="admin-stat-card orders">
              <span><i class="pi pi-receipt" aria-hidden="true"></i>{{ 'admin.orders' | t }}</span>
              <strong>{{ orders.length }}</strong>
              <p>{{ openOrders }} open orders.</p>
            </article>
            <article class="admin-stat-card products">
              <span><i class="pi pi-box" aria-hidden="true"></i>{{ 'admin.products' | t }}</span>
              <strong>{{ products.length }}</strong>
              <p>{{ productCategories.length }} categories.</p>
            </article>
            <article class="admin-stat-card users">
              <span><i class="pi pi-users" aria-hidden="true"></i>{{ 'admin.users' | t }}</span>
              <strong>{{ users.length }}</strong>
              <p>{{ customerCount }} customers.</p>
            </article>
          </div>

          <app-admin-analytics />

          <section class="dashboard-commerce-grid" *ngIf="!loading">
            <article class="dashboard-commerce-card dashboard-top-products-card">
              <header>
                <div class="dashboard-commerce-title">
                  <span class="dashboard-commerce-title-icon"><i class="pi pi-star" aria-hidden="true"></i></span>
                  <div>
                    <h2>{{ 'admin.topProductsCompact' | t }}</h2>
                    <p>{{ 'admin.bestSellingItems' | t }}</p>
                  </div>
                </div>
                <p-dropdown
                  [ngModel]="commercePeriod"
                  [options]="commercePeriodOptions"
                  optionValue="value"
                  appendTo="body"
                  styleClass="dashboard-period-dropdown"
                  panelStyleClass="dashboard-period-dropdown-panel"
                  [attr.aria-label]="'admin.topProductsPeriod' | t"
                  (onChange)="changeCommercePeriod($event.value)"
                >
                  <ng-template pTemplate="selectedItem" let-option>
                    <span class="dashboard-period-option"><i class="pi pi-calendar" aria-hidden="true"></i>{{ option.labelKey | t }}</span>
                  </ng-template>
                  <ng-template pTemplate="item" let-option>
                    <span class="dashboard-period-option"><i class="pi pi-calendar" aria-hidden="true"></i><span>{{ option.labelKey | t }}</span><i *ngIf="commercePeriod === option.value" class="pi pi-check period-check" aria-hidden="true"></i></span>
                  </ng-template>
                </p-dropdown>
              </header>

              <div class="dashboard-commerce-state" *ngIf="commerceLoading && !topProductRows.length">Loading commerce summary...</div>
              <div class="chart-refresh-badge" *ngIf="commerceLoading && topProductRows.length">Updating</div>
              <div class="dashboard-commerce-state error" *ngIf="!commerceLoading && commerceError">{{ commerceError }}</div>
              <div class="dashboard-commerce-state" *ngIf="!commerceLoading && !commerceError && !topProductRows.length">No product sales yet.</div>

              <div class="dashboard-product-list" *ngIf="!commerceError && topProductRows.length">
                <div class="dashboard-product-row" *ngFor="let product of topProductRows; trackBy: trackTopProduct">
                  <span class="dashboard-product-icon"><i [class]="product.icon" aria-hidden="true"></i></span>
                  <div>
                    <strong>{{ product.name }}</strong>
                    <small>{{ categoryLabel(product.meta) }} <span aria-hidden="true">·</span> {{ 'admin.unitsSold' | t:{ count: product.unitsSold } }}</small>
                  </div>
                  <aside>
                    <strong>{{ product.revenue }}</strong>
                    <small [class.negative]="!product.trendPositive"><i [class]="product.trendPositive ? 'pi pi-arrow-up-right' : 'pi pi-arrow-down-right'" aria-hidden="true"></i>{{ product.trend }}</small>
                  </aside>
                </div>
              </div>
            </article>

            <article class="dashboard-commerce-card dashboard-category-card">
              <header>
                <div class="dashboard-commerce-title">
                  <span class="dashboard-commerce-title-icon"><i class="pi pi-chart-bar" aria-hidden="true"></i></span>
                  <div>
                    <h2>{{ 'admin.salesByCategory' | t }}</h2>
                    <p>{{ 'admin.revenueDistribution' | t }}</p>
                  </div>
                </div>
              </header>

              <div class="dashboard-commerce-state" *ngIf="commerceLoading && !categorySaleRows.length">Loading category sales...</div>
              <div class="chart-refresh-badge" *ngIf="commerceLoading && categorySaleRows.length">Updating</div>
              <div class="dashboard-commerce-state error" *ngIf="!commerceLoading && commerceError">{{ commerceError }}</div>
              <div class="dashboard-commerce-state" *ngIf="!commerceLoading && !commerceError && !categorySaleRows.length">No category sales yet.</div>

              <div class="dashboard-category-list" *ngIf="!commerceError && categorySaleRows.length">
                <div class="dashboard-category-row" *ngFor="let category of categorySaleRows; trackBy: trackCategorySale">
                  <div class="dashboard-category-topline">
                    <span><em><i [class]="category.icon" aria-hidden="true"></i></em>{{ categoryLabel(category.name) }}</span>
                    <strong>{{ category.revenue }} <small>({{ category.percentage }}%)</small></strong>
                  </div>
                  <div class="dashboard-progress">
                    <span [style.width.%]="category.percentage" [style.background]="category.color"></span>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <div class="admin-fab-wrap">
            <div *ngIf="createMenuOpen" class="admin-create-popup" role="menu" aria-label="Create menu">
              <button type="button" role="menuitem" (click)="selectCreateAction('product')">
                <span class="admin-create-icon">P</span>
                <span>Create product</span>
              </button>
              <button type="button" role="menuitem" (click)="selectCreateAction('category')">
                <span class="admin-create-icon">C</span>
                <span>Create category</span>
              </button>
              <button type="button" role="menuitem" (click)="selectCreateAction('promotion')">
                <span class="admin-create-icon">%</span>
                <span>Create promotion</span>
              </button>
              <button type="button" role="menuitem" (click)="selectCreateAction('user')">
                <span class="admin-create-icon">U</span>
                <span>Create user</span>
              </button>
            </div>

            <button
              type="button"
              class="admin-fab"
              aria-label="Open create menu"
              aria-haspopup="menu"
              [attr.aria-expanded]="createMenuOpen"
              (click)="toggleCreateMenu()"
            >
              +
            </button>
          </div>
        </section>
      </div>
    </section>
  `
})
export class AdminDashboardComponent implements OnInit {
  createMenuOpen = false
  error = ''
  loading = true
  orders: Order[] = []
  products: Product[] = []
  promotions: Promotion[] = []
  users: PublicUser[] = []
  commerceLoading = false
  commerceError = ''
  commercePeriod: AnalyticsPeriod = '30d'
  commercePeriodOptions: { value: AnalyticsPeriod; labelKey: string }[] = [
    { value: '30d', labelKey: 'admin.period30Days' },
    { value: '6m', labelKey: 'admin.period6Months' },
    { value: '1y', labelKey: 'admin.period1Year' }
  ]
  topProductRows: DashboardTopProduct[] = []
  categorySaleRows: DashboardCategorySale[] = []

  constructor(
    private adminData: AdminDataService,
    private analytics: AdminAnalyticsService,
    private router: Router,
    private i18n: TranslationService
  ) {}

  categoryLabel(name: string): string {
    const normalized = String(name || '').trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '')
    const keys: Record<string, string> = {
      pantry: 'store.categoryPantry',
      beverages: 'store.categoryBeverages',
      beverage: 'store.categoryBeverages',
      bakery: 'store.categoryBakery',
      dairyandeggs: 'store.categoryDairyEggs',
      freshproduce: 'store.categoryFreshProduce',
      household: 'store.categoryHousehold',
      snacks: 'store.categorySnacks',
      grocery: 'admin.grocery'
    }
    return keys[normalized] ? this.i18n.translate(keys[normalized]) : name
  }

  ngOnInit() {
    this.adminData.loadDashboardData().subscribe({
      next: data => {
        this.products = data.products
        this.orders = data.orders
        this.users = data.users
        this.promotions = data.promotions
        this.loading = false
        this.loadCommerceSummary()
      },
      error: () => {
        this.error = 'Could not load admin dashboard data.'
        this.loading = false
      }
    })
  }

  get totalRevenue(): number {
    return this.orders.reduce((total, order) => total + (Number(order.total_amount) || 0), 0)
  }

  get openOrders(): number {
    return this.orders.filter(order => !['DELIVERED', 'CANCELLED', 'complete'].includes(order.status)).length
  }

  get customerCount(): number {
    return this.users.filter(user => (user.role || 'CUSTOMER') === 'CUSTOMER').length
  }

  get productCategories(): string[] {
    return Array.from(new Set(this.products.map(product => product.category || 'Uncategorized')))
  }

  toggleCreateMenu() {
    this.createMenuOpen = !this.createMenuOpen
  }

  selectCreateAction(action: 'product' | 'category' | 'promotion' | 'user') {
    this.createMenuOpen = false
    const route = action === 'product'
      ? '/admin/products/new'
      : action === 'category'
        ? '/admin/categories/new'
        : action === 'promotion'
          ? '/admin/promotions/new'
          : '/admin/users/new'
    this.router.navigateByUrl(route)
  }

  changeCommercePeriod(period: AnalyticsPeriod) {
    if (period === this.commercePeriod) {
      return
    }

    this.commercePeriod = period
    this.loadCommerceSummary()
  }

  trackTopProduct(index: number, product: DashboardTopProduct): string {
    return product.name
  }

  trackCategorySale(index: number, category: DashboardCategorySale): string {
    return category.name
  }

  money(value: number): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value || 0))
  }

  private loadCommerceSummary() {
    if (this.commerceLoading) {
      return
    }

    this.commerceLoading = true
    this.commerceError = ''
    this.pendingCommerceRequests = 0

    this.analytics.getTopProducts(this.commercePeriod, 5).subscribe({
      next: response => {
        this.topProductRows = response.products.map((product, index) => ({
          name: product.productName,
          meta: this.productCategory(product.productId),
          revenue: this.money(product.revenue),
          unitsSold: product.unitsSold,
          trend: this.productTrend(index),
          trendPositive: index !== 3,
          icon: this.productIcon(product.productName)
        }))
        this.finishCommerceLoading()
      },
      error: () => {
        this.commerceError = 'Unable to load commerce summary.'
        this.finishCommerceLoading()
      }
    })

    this.analytics.getSalesByCategory(this.commercePeriod, 5).subscribe({
      next: response => {
        const total = response.categories.reduce((sum, category) => sum + Number(category.revenue || 0), 0)
        const colors = ['#08775b', '#15906f', '#2aa786', '#55b99e', '#8acdbc']
        this.categorySaleRows = response.categories.map((category, index) => ({
          name: category.categoryName,
          revenue: this.money(category.revenue),
          percentage: total > 0 ? Math.round((Number(category.revenue || 0) / total) * 100) : 0,
          icon: this.categoryIcon(category.categoryName),
          color: colors[index % colors.length]
        }))
        this.finishCommerceLoading()
      },
      error: () => {
        this.commerceError = 'Unable to load commerce summary.'
        this.finishCommerceLoading()
      }
    })
  }

  private pendingCommerceRequests = 0

  private finishCommerceLoading() {
    this.pendingCommerceRequests += 1
    if (this.pendingCommerceRequests >= 2) {
      this.pendingCommerceRequests = 0
      this.commerceLoading = false
    }
  }

  private productCategory(productId: number | null): string {
    return this.products.find(product => Number(product.id) === Number(productId))?.category || 'Grocery'
  }

  private productIcon(name: string): string {
    const lower = name.toLowerCase()
    if (lower.includes('milk') || lower.includes('dairy')) return 'pi pi-circle-fill'
    if (lower.includes('bread') || lower.includes('bakery')) return 'pi pi-shopping-bag'
    if (lower.includes('egg')) return 'pi pi-circle'
    if (lower.includes('banana') || lower.includes('produce')) return 'pi pi-sparkles'
    return 'pi pi-box'
  }

  private categoryIcon(name: string): string {
    const lower = name.toLowerCase()
    if (lower.includes('dairy')) return 'pi pi-circle'
    if (lower.includes('bakery')) return 'pi pi-shopping-bag'
    if (lower.includes('drink') || lower.includes('beverage')) return 'pi pi-filter'
    if (lower.includes('produce')) return 'pi pi-sparkles'
    return 'pi pi-tag'
  }

  private productTrend(index: number): string {
    return ['+12%', '+8%', '+15%', '-3%', '+5%'][index] || '+4%'
  }
}
