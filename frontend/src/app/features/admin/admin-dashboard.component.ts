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
  imports: [CommonModule, FormsModule, RouterModule, AdminSidebarComponent, AdminAnalyticsComponent, AdminPageHeaderComponent, AdminStateBlockComponent, TranslatePipe],
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
            <article class="dashboard-commerce-card">
              <header>
                <div>
                  <h2>Top Products</h2>
                  <p>Best selling items</p>
                </div>
                <select
                  class="dashboard-period-select"
                  [ngModel]="commercePeriod"
                  (ngModelChange)="changeCommercePeriod($event)"
                  aria-label="Top products period"
                >
                  <option *ngFor="let option of commercePeriodOptions" [ngValue]="option.value">{{ option.label }}</option>
                </select>
              </header>

              <div class="dashboard-commerce-state" *ngIf="commerceLoading">Loading commerce summary...</div>
              <div class="dashboard-commerce-state error" *ngIf="!commerceLoading && commerceError">{{ commerceError }}</div>
              <div class="dashboard-commerce-state" *ngIf="!commerceLoading && !commerceError && !topProductRows.length">No product sales yet.</div>

              <div class="dashboard-product-list" *ngIf="!commerceLoading && !commerceError && topProductRows.length">
                <div class="dashboard-product-row" *ngFor="let product of topProductRows; trackBy: trackTopProduct">
                  <span class="dashboard-product-icon">{{ product.icon }}</span>
                  <div>
                    <strong>{{ product.name }}</strong>
                    <small>{{ product.meta }} · {{ product.unitsSold }} sold</small>
                  </div>
                  <aside>
                    <strong>{{ product.revenue }}</strong>
                    <small [class.negative]="!product.trendPositive">{{ product.trend }}</small>
                  </aside>
                </div>
              </div>
            </article>

            <article class="dashboard-commerce-card">
              <header>
                <div>
                  <h2>Sales by Category</h2>
                  <p>Revenue distribution</p>
                </div>
              </header>

              <div class="dashboard-commerce-state" *ngIf="commerceLoading">Loading category sales...</div>
              <div class="dashboard-commerce-state error" *ngIf="!commerceLoading && commerceError">{{ commerceError }}</div>
              <div class="dashboard-commerce-state" *ngIf="!commerceLoading && !commerceError && !categorySaleRows.length">No category sales yet.</div>

              <div class="dashboard-category-list" *ngIf="!commerceLoading && !commerceError && categorySaleRows.length">
                <div class="dashboard-category-row" *ngFor="let category of categorySaleRows; trackBy: trackCategorySale">
                  <div class="dashboard-category-topline">
                    <span><em>{{ category.icon }}</em>{{ category.name }}</span>
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
  commercePeriodOptions: { value: AnalyticsPeriod; label: string }[] = [
    { value: '30d', label: '30 Days' },
    { value: '6m', label: '6 Months' },
    { value: '1y', label: '1 Year' }
  ]
  topProductRows: DashboardTopProduct[] = []
  categorySaleRows: DashboardCategorySale[] = []

  constructor(
    private adminData: AdminDataService,
    private analytics: AdminAnalyticsService,
    private router: Router
  ) {}

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
        const colors = ['#2f80ed', '#2ecc71', '#a855f7', '#f97316', '#ec4899']
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
    if (lower.includes('milk') || lower.includes('dairy')) return '🥛'
    if (lower.includes('bread') || lower.includes('bakery')) return '🍞'
    if (lower.includes('egg')) return '🥚'
    if (lower.includes('banana')) return '🍌'
    if (lower.includes('chicken') || lower.includes('meat')) return '🍗'
    return '🛒'
  }

  private categoryIcon(name: string): string {
    const lower = name.toLowerCase()
    if (lower.includes('dairy')) return '🥛'
    if (lower.includes('bakery')) return '🍞'
    if (lower.includes('drink') || lower.includes('beverage')) return '🥤'
    if (lower.includes('meat') || lower.includes('seafood')) return '🥩'
    return '🛒'
  }

  private productTrend(index: number): string {
    return ['↗ +12%', '↗ +8%', '↗ +15%', '↘ -3%', '↗ +5%'][index] || '↗ +4%'
  }
}
