import { CommonModule } from '@angular/common'
import { Component, OnDestroy, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { DropdownModule } from 'primeng/dropdown'
import { Subscription } from 'rxjs'
import { timeout } from 'rxjs/operators'
import { AdminDataService } from '../../core/services/admin-data.service'
import { ActivatedRoute } from '@angular/router'
import { Order } from '../../shared/interfaces/order'
import { AdminSidebarComponent } from './admin-sidebar.component'
import { DeliveryOrdersMapComponent } from './delivery-orders-map.component'

@Component({
  selector: 'app-delivery-map-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule, AdminSidebarComponent, DeliveryOrdersMapComponent],
  template: `
    <section class="admin-shell">
      <app-admin-sidebar />
      <div class="admin-shell-content">
        <section class="admin-page delivery-map-page">
          <header class="admin-page-header">
            <div class="admin-page-title">
              <p class="eyebrow">Delivery operations</p>
              <h1>Delivery map</h1>
              <p class="muted">Select an order marker to open its complete order record.</p>
            </div>
          </header>
          <div class="delivery-map-stats" aria-label="Delivery summary">
            <article class="total"><span><i class="pi pi-receipt" aria-hidden="true"></i></span><div><strong>{{ orders.length }}</strong><small>All orders</small></div></article>
            <article class="delivery"><span><i class="pi pi-map-marker" aria-hidden="true"></i></span><div><strong>{{ deliveryOrderCount }}</strong><small>Mapped deliveries</small></div></article>
            <article class="transit"><span><i class="pi pi-truck" aria-hidden="true"></i></span><div><strong>{{ outForDeliveryCount }}</strong><small>Out for delivery</small></div></article>
            <article class="complete"><span><i class="pi pi-check-circle" aria-hidden="true"></i></span><div><strong>{{ deliveredCount }}</strong><small>Delivered</small></div></article>
          </div>
          <section class="delivery-map-filters" aria-label="Delivery map filters">
            <label class="delivery-map-search">
              <span>Search orders</span>
              <div><i class="pi pi-search" aria-hidden="true"></i><input type="search" [(ngModel)]="search" (ngModelChange)="applyFilters()" placeholder="Order number or delivery address" /></div>
            </label>
            <label>
              <span>Order status</span>
              <p-dropdown [(ngModel)]="statusFilter" (onChange)="applyFilters()" [options]="statusOptions" optionLabel="label" optionValue="value" appendTo="body" styleClass="delivery-filter-dropdown" panelStyleClass="delivery-filter-dropdown-panel">
                <ng-template pTemplate="selectedItem" let-option><span class="delivery-filter-option"><i [class]="option.icon" [attr.data-tone]="option.tone" aria-hidden="true"></i><span>{{ option.label }}</span></span></ng-template>
                <ng-template pTemplate="item" let-option><span class="delivery-filter-option"><i [class]="option.icon" [attr.data-tone]="option.tone" aria-hidden="true"></i><span>{{ option.label }}</span><i *ngIf="statusFilter === option.value" class="pi pi-check option-check" aria-hidden="true"></i></span></ng-template>
              </p-dropdown>
            </label>
            <label>
              <span>Payment status</span>
              <p-dropdown [(ngModel)]="paymentFilter" (onChange)="applyFilters()" [options]="paymentOptions" optionLabel="label" optionValue="value" appendTo="body" styleClass="delivery-filter-dropdown" panelStyleClass="delivery-filter-dropdown-panel">
                <ng-template pTemplate="selectedItem" let-option><span class="delivery-filter-option"><i [class]="option.icon" [attr.data-tone]="option.tone" aria-hidden="true"></i><span>{{ option.label }}</span></span></ng-template>
                <ng-template pTemplate="item" let-option><span class="delivery-filter-option"><i [class]="option.icon" [attr.data-tone]="option.tone" aria-hidden="true"></i><span>{{ option.label }}</span><i *ngIf="paymentFilter === option.value" class="pi pi-check option-check" aria-hidden="true"></i></span></ng-template>
              </p-dropdown>
            </label>
            <div class="delivery-map-filter-actions">
              <span><strong>{{ filteredDeliveryCount }}</strong> shown on map</span>
              <button type="button" (click)="resetFilters()" [disabled]="!hasActiveFilters"><i class="pi pi-filter-slash" aria-hidden="true"></i> Reset</button>
            </div>
          </section>
          <p *ngIf="loading" class="map-dialog-state">Loading delivery orders…</p>
          <p *ngIf="error" class="map-dialog-state error">{{ error }}</p>
          <app-delivery-orders-map *ngIf="!loading && !error" [orders]="filteredOrders" [focusOrderId]="focusOrderId" />
        </section>
      </div>
    </section>
  `
})
export class DeliveryMapPageComponent implements OnInit, OnDestroy {
  orders: Order[] = []
  filteredOrders: Order[] = []
  loading = true
  error = ''
  focusOrderId: number | null = null
  search = ''
  statusFilter = 'ALL'
  paymentFilter = 'ALL'
  readonly statusOptions = [
    { value: 'ALL', label: 'All statuses', icon: 'pi pi-list', tone: 'neutral' },
    { value: 'PENDING', label: 'Pending', icon: 'pi pi-clock', tone: 'warning' },
    { value: 'CONFIRMED', label: 'Confirmed', icon: 'pi pi-check-circle', tone: 'info' },
    { value: 'PREPARING', label: 'Preparing', icon: 'pi pi-box', tone: 'warning' },
    { value: 'OUT_FOR_DELIVERY', label: 'Out for delivery', icon: 'pi pi-truck', tone: 'info' },
    { value: 'DELIVERED', label: 'Delivered', icon: 'pi pi-home', tone: 'success' },
    { value: 'CANCELLED', label: 'Cancelled', icon: 'pi pi-ban', tone: 'danger' }
  ]
  readonly paymentOptions = [
    { value: 'ALL', label: 'All payments', icon: 'pi pi-wallet', tone: 'neutral' },
    { value: 'PENDING', label: 'Pending', icon: 'pi pi-clock', tone: 'warning' },
    { value: 'PAID', label: 'Paid', icon: 'pi pi-check-circle', tone: 'success' },
    { value: 'FAILED', label: 'Failed', icon: 'pi pi-times-circle', tone: 'danger' },
    { value: 'REFUNDED', label: 'Refunded', icon: 'pi pi-replay', tone: 'purple' }
  ]
  private subscription?: Subscription
  get deliveryOrderCount(): number { return this.orders.filter(order => order.delivery_type === 'DELIVERY' && !!order.delivery_address).length }
  get outForDeliveryCount(): number { return this.orders.filter(order => order.status === 'OUT_FOR_DELIVERY').length }
  get deliveredCount(): number { return this.orders.filter(order => order.status === 'DELIVERED' || order.status === 'complete').length }
  applyFilters(): void {
    const query = this.search.trim().toLowerCase()
    this.filteredOrders = this.orders.filter(order => {
      const matchesSearch = !query || String(order.id || '').includes(query) || String(order.delivery_address || '').toLowerCase().includes(query)
      const matchesStatus = this.statusFilter === 'ALL' || order.status === this.statusFilter
      const matchesPayment = this.paymentFilter === 'ALL' || order.payment_status === this.paymentFilter
      return matchesSearch && matchesStatus && matchesPayment
    })
  }
  get filteredDeliveryCount(): number { return this.filteredOrders.filter(order => order.delivery_type === 'DELIVERY' && !!order.delivery_address).length }
  get hasActiveFilters(): boolean { return !!this.search.trim() || this.statusFilter !== 'ALL' || this.paymentFilter !== 'ALL' }
  resetFilters(): void { this.search = ''; this.statusFilter = 'ALL'; this.paymentFilter = 'ALL'; this.applyFilters() }
  constructor(private adminData: AdminDataService, private route: ActivatedRoute) {}
  ngOnInit(): void {
    const requestedOrder = Number(this.route.snapshot.queryParamMap.get('order'))
    this.focusOrderId = Number.isInteger(requestedOrder) && requestedOrder > 0 ? requestedOrder : null
    this.subscription = this.adminData.loadOrders().pipe(timeout(10000)).subscribe({
      next: orders => { this.orders = orders; this.applyFilters(); this.loading = false },
      error: () => { this.error = 'Could not load delivery orders.'; this.loading = false }
    })
  }
  ngOnDestroy(): void { this.subscription?.unsubscribe() }
}
