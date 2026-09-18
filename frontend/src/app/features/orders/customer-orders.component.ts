import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { finalize } from 'rxjs/operators'
import { OrderService } from '../../core/services/order.service'
import { TranslationService } from '../../core/i18n/translation.service'
import { TranslatePipe } from '../../core/i18n/translate.pipe'
import { Order } from '../../shared/interfaces/order'

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="orders-page" [attr.dir]="language === 'ar' ? 'rtl' : 'ltr'">
      <header class="orders-heading">
        <div>
          <span class="eyebrow">{{ 'customerOrders.eyebrow' | t }}</span>
          <h1>{{ 'customerOrders.title' | t }}</h1>
          <p>{{ 'customerOrders.subtitle' | t }}</p>
        </div>
        <a routerLink="/products" class="shop-link"><i class="pi pi-shopping-bag"></i>{{ 'customerOrders.shopNow' | t }}</a>
      </header>

      <section *ngIf="loading" class="orders-state"><i class="pi pi-spin pi-spinner"></i>{{ 'common.loading' | t }}</section>
      <section *ngIf="error" class="orders-state orders-state--error">
        <i class="pi pi-exclamation-circle"></i><span>{{ error }}</span>
        <button type="button" (click)="loadOrders()">{{ 'common.retry' | t }}</button>
      </section>
      <section *ngIf="!loading && !error && !orders.length" class="orders-state orders-state--empty">
        <span class="state-icon"><i class="pi pi-receipt"></i></span>
        <strong>{{ 'customerOrders.empty' | t }}</strong>
        <a routerLink="/products">{{ 'customerOrders.shopNow' | t }}</a>
      </section>

      <section *ngIf="!loading && orders.length" class="orders-list">
        <article *ngFor="let order of orders; trackBy: trackOrder" class="order-card">
          <header class="order-card-header">
            <div class="order-identity">
              <span class="order-icon"><i class="pi pi-receipt"></i></span>
              <div><small>{{ 'customerOrders.order' | t }}</small><strong>#{{ order.id }}</strong></div>
            </div>
            <span class="status-chip" [attr.data-status]="normalizedStatus(order.status)">
              <i class="pi" [ngClass]="statusIcon(order.status)"></i>{{ statusLabel(order.status) }}
            </span>
          </header>

          <div class="order-summary">
            <div><small>{{ 'customerOrders.placedOn' | t }}</small><strong>{{ order.created_at | date:'medium' }}</strong></div>
            <div><small>{{ 'customerOrders.delivery' | t }}</small><strong>{{ deliveryLabel(order) }}</strong></div>
            <div><small>{{ 'customerOrders.payment' | t }}</small><strong>{{ paymentLabel(order) }}</strong></div>
            <div><small>{{ 'customerOrders.total' | t }}</small><strong class="order-total">₪{{ number(order.total_amount) | number:'1.2-2' }}</strong></div>
          </div>

          <div *ngIf="expandedOrderId === order.id" class="order-details">
            <div *ngIf="detailsLoadingId === order.id" class="detail-loading"><i class="pi pi-spin pi-spinner"></i>{{ 'common.loading' | t }}</div>
            <ng-container *ngIf="detailsLoadingId !== order.id">
              <div *ngIf="order.items?.length; else noItems" class="order-items">
                <div *ngFor="let item of order.items" class="order-item">
                  <span class="item-picture"><i class="pi pi-box"></i></span>
                  <div><strong>{{ item.product_name || ('customerOrders.items' | t) }}</strong><small>{{ item.category || '' }}</small></div>
                  <span>{{ 'customerOrders.quantity' | t }}: {{ item.quantity }}</span>
                  <b>₪{{ number(item.price) * item.quantity | number:'1.2-2' }}</b>
                </div>
              </div>
              <ng-template #noItems><p class="no-items">{{ 'customerOrders.noItems' | t }}</p></ng-template>
              <p *ngIf="order.delivery_address" class="delivery-address"><i class="pi pi-map-marker"></i>{{ order.delivery_address }}</p>
            </ng-container>
          </div>

          <footer class="order-actions">
            <button type="button" class="details-button" (click)="toggleDetails(order)">
              <i class="pi" [ngClass]="expandedOrderId === order.id ? 'pi-chevron-up' : 'pi-eye'"></i>
              {{ (expandedOrderId === order.id ? 'customerOrders.hideDetails' : 'customerOrders.details') | t }}
            </button>
            <button *ngIf="canCancel(order)" type="button" class="cancel-button" [disabled]="cancellingId === order.id" (click)="cancel(order)">
              <i class="pi" [ngClass]="cancellingId === order.id ? 'pi-spin pi-spinner' : 'pi-times-circle'"></i>
              {{ (cancellingId === order.id ? 'customerOrders.cancelling' : 'customerOrders.cancel') | t }}
            </button>
          </footer>
        </article>
      </section>
    </main>
  `,
  styles: [`
    :host { display:block; background:#f4f7f6; min-height:calc(100vh - 74px); }
    .orders-page { box-sizing:border-box; margin:auto; max-width:1180px; padding:clamp(22px,4vw,48px) 18px 64px; }
    .orders-heading { align-items:flex-end; display:flex; gap:24px; justify-content:space-between; margin-bottom:24px; }
    .eyebrow { color:#08755c; font-size:.72rem; font-weight:900; letter-spacing:.08em; }
    h1 { color:#102b25; font-size:clamp(1.8rem,4vw,2.7rem); line-height:1.15; margin:5px 0 7px; }
    .orders-heading p { color:#657871; margin:0; }
    .shop-link,.orders-state a { align-items:center; background:#08243f; border-radius:10px; color:#fff; display:inline-flex; font-weight:800; gap:8px; min-height:42px; padding:0 15px; text-decoration:none; }
    .orders-list { display:grid; gap:16px; }
    .order-card { background:#fff; border:1px solid #dce7e3; border-radius:16px; box-shadow:0 8px 24px rgba(17,53,45,.06); overflow:hidden; }
    .order-card-header { align-items:center; border-bottom:1px solid #edf2f0; display:flex; justify-content:space-between; padding:17px 20px; }
    .order-identity { align-items:center; display:flex; gap:11px; }
    .order-icon,.state-icon { align-items:center; background:#eaf6f1; border-radius:11px; color:#08755c; display:flex; height:42px; justify-content:center; width:42px; }
    .order-identity div { display:grid; }.order-identity small,.order-summary small { color:#71827c; font-size:.72rem; }.order-identity strong { color:#142b26; font-size:1.08rem; }
    .status-chip { align-items:center; background:#fff4d9; border:1px solid #f3dda3; border-radius:999px; color:#8b6200; display:inline-flex; font-size:.75rem; font-weight:900; gap:6px; padding:7px 10px; }
    .status-chip[data-status='DELIVERED'] { background:#e9f8f1; border-color:#bce8d6; color:#087153; }
    .status-chip[data-status='CANCELLED'] { background:#fff0f0; border-color:#f4caca; color:#b32929; }
    .status-chip[data-status='OUT_FOR_DELIVERY'],.status-chip[data-status='CONFIRMED'] { background:#edf5ff; border-color:#cbdff7; color:#2865a5; }
    .order-summary { display:grid; gap:12px; grid-template-columns:repeat(4,minmax(0,1fr)); padding:18px 20px; }
    .order-summary div { background:#f7faf9; border-radius:10px; display:grid; gap:5px; min-width:0; padding:12px; }.order-summary strong { color:#213832; overflow-wrap:anywhere; }.order-total { color:#08755c!important; }
    .order-details { border-top:1px solid #edf2f0; padding:4px 20px 16px; }.order-items { display:grid; }.order-item { align-items:center; border-bottom:1px solid #edf2f0; display:grid; gap:12px; grid-template-columns:auto minmax(0,1fr) auto auto; padding:13px 0; }.item-picture { align-items:center; background:#edf6f2; border-radius:9px; color:#08755c; display:flex; height:38px; justify-content:center; width:38px; }.order-item div { display:grid; }.order-item small,.order-item>span { color:#74847e; font-size:.75rem; }.delivery-address { align-items:center; color:#526861; display:flex; gap:8px; margin:14px 0 0; }.detail-loading,.no-items { color:#71827c; padding:18px 0; text-align:center; }
    .order-actions { align-items:center; background:#fbfcfc; border-top:1px solid #edf2f0; display:flex; gap:10px; justify-content:flex-end; padding:12px 20px; }.order-actions button,.orders-state button { align-items:center; border-radius:9px; display:inline-flex; font:inherit; font-size:.8rem; font-weight:800; gap:7px; min-height:39px; padding:0 13px; }.details-button { background:#fff; border:1px solid #cbdad5; color:#173c33; }.cancel-button { background:#fff1f1; border:1px solid #f1c8c8; color:#b02727; }.cancel-button:disabled { opacity:.6; }
    .orders-state { align-items:center; background:#fff; border:1px solid #dce7e3; border-radius:16px; color:#657871; display:flex; gap:10px; justify-content:center; min-height:220px; padding:24px; }.orders-state--empty { flex-direction:column; }.orders-state--error { color:#a52a2a; }.orders-state button { background:#fff; border:1px solid #d9c3c3; color:#8e2525; }
    [dir='rtl'] { font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:700px){.orders-heading{align-items:stretch;flex-direction:column}.shop-link{align-self:flex-start}.order-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.order-card-header,.order-summary,.order-details{padding-inline:14px}.order-item{grid-template-columns:auto minmax(0,1fr) auto}.order-item>b{grid-column:2/-1}.order-actions{justify-content:stretch;padding-inline:14px}.order-actions button{justify-content:center;flex:1}}
    @media(max-width:390px){.orders-page{padding-inline:10px}.order-summary{grid-template-columns:1fr}.order-actions{flex-direction:column}.order-actions button{width:100%}}
  `]
})
export class CustomerOrdersComponent implements OnInit {
  orders: Order[] = []
  loading = true
  error = ''
  expandedOrderId?: number
  detailsLoadingId?: number
  cancellingId?: number

  constructor(private ordersService: OrderService, private i18n: TranslationService, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void { this.loadOrders() }
  get language(): string { return this.i18n.currentLanguage }
  loadOrders(): void {
    this.loading = true; this.error = ''
    this.ordersService.getMyOrders().pipe(finalize(() => { this.loading = false; this.cdr.markForCheck() })).subscribe({
      next: orders => { this.orders = [...orders].sort((a,b) => Number(b.id) - Number(a.id)) },
      error: () => { this.error = this.i18n.translate('customerOrders.loadError') }
    })
  }
  toggleDetails(order: Order): void {
    if (this.expandedOrderId === order.id) { this.expandedOrderId = undefined; return }
    this.expandedOrderId = order.id
    if (order.items || !order.id) return
    this.detailsLoadingId = order.id
    this.ordersService.getOrder(order.id).pipe(finalize(() => { this.detailsLoadingId = undefined; this.cdr.markForCheck() })).subscribe({ next: detail => Object.assign(order, detail) })
  }
  cancel(order: Order): void {
    if (!order.id || !window.confirm(this.i18n.translate('customerOrders.confirmCancel'))) return
    this.cancellingId = order.id; this.error = ''
    this.ordersService.cancelOrder(order.id).pipe(finalize(() => { this.cancellingId = undefined; this.cdr.markForCheck() })).subscribe({
      next: updated => Object.assign(order, updated),
      error: () => { this.error = this.i18n.translate('customerOrders.cancelError') }
    })
  }
  canCancel(order: Order): boolean { return ['PENDING','CONFIRMED','active'].includes(order.status) }
  normalizedStatus(status: Order['status']): string { return status === 'complete' ? 'DELIVERED' : status === 'active' ? 'PENDING' : status }
  statusLabel(status: Order['status']): string {
    const labels: Record<string,[string,string]> = { PENDING:['Pending','قيد الانتظار'], CONFIRMED:['Confirmed','تم التأكيد'], PREPARING:['Preparing','قيد التحضير'], OUT_FOR_DELIVERY:['Out for delivery','خرج للتوصيل'], DELIVERED:['Delivered','تم التوصيل'], CANCELLED:['Cancelled','ملغي'] }
    return (labels[this.normalizedStatus(status)] || [status,status])[this.language === 'ar' ? 1 : 0]
  }
  statusIcon(status: Order['status']): string { const value=this.normalizedStatus(status); return value==='DELIVERED'?'pi-check-circle':value==='CANCELLED'?'pi-times-circle':value==='OUT_FOR_DELIVERY'?'pi-truck':'pi-clock' }
  deliveryLabel(order: Order): string { return this.i18n.translate(order.delivery_type === 'DELIVERY' ? 'customerOrders.deliveryOrder' : 'customerOrders.pickup') }
  paymentLabel(order: Order): string { return `${order.payment_method || 'CASH'} · ${order.payment_status || 'PENDING'}` }
  number(value: unknown): number { return Number(value) || 0 }
  trackOrder(_: number, order: Order): number { return Number(order.id) }
}
