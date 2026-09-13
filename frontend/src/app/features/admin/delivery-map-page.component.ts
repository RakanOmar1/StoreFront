import { CommonModule } from '@angular/common'
import { Component, OnDestroy, OnInit } from '@angular/core'
import { Subscription } from 'rxjs'
import { timeout } from 'rxjs/operators'
import { AdminDataService } from '../../core/services/admin-data.service'
import { Order } from '../../shared/interfaces/order'
import { AdminSidebarComponent } from './admin-sidebar.component'
import { DeliveryOrdersMapComponent } from './delivery-orders-map.component'

@Component({
  selector: 'app-delivery-map-page',
  standalone: true,
  imports: [CommonModule, AdminSidebarComponent, DeliveryOrdersMapComponent],
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
          <p *ngIf="loading" class="map-dialog-state">Loading delivery orders…</p>
          <p *ngIf="error" class="map-dialog-state error">{{ error }}</p>
          <app-delivery-orders-map *ngIf="!loading && !error" [orders]="orders" />
        </section>
      </div>
    </section>
  `
})
export class DeliveryMapPageComponent implements OnInit, OnDestroy {
  orders: Order[] = []
  loading = true
  error = ''
  private subscription?: Subscription
  constructor(private adminData: AdminDataService) {}
  ngOnInit(): void {
    this.subscription = this.adminData.loadOrders().pipe(timeout(10000)).subscribe({
      next: orders => { this.orders = orders; this.loading = false },
      error: () => { this.error = 'Could not load delivery orders.'; this.loading = false }
    })
  }
  ngOnDestroy(): void { this.subscription?.unsubscribe() }
}
