import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { CartService } from '../../core/services/cart.service'
import { AuthService } from '../../core/services/auth.service'
import { TranslatePipe } from '../../core/i18n/translate.pipe'

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
  template: `
  <section class="cart" *ngIf="(cart$ | async) as items">
    <div class="cart-header">
      <div>
        <p class="eyebrow">{{ 'cart.shoppingBag' | t }}</p>
        <h1>{{ 'cart.title' | t }}</h1>
        <p class="muted">{{ 'cart.subtitle' | t }}</p>
      </div>

      <a routerLink="/" class="continue-link">{{ 'cart.continueShopping' | t }}</a>
    </div>

    <div *ngIf="items.length === 0" class="empty">
      {{ 'cart.empty' | t }}
      <a routerLink="/">{{ 'cart.browseProducts' | t }}</a>
    </div>

    <div class="cart-layout" *ngIf="items.length > 0">
      <div class="cart-list">
        <article class="cart-item" *ngFor="let i of items">
          <div class="cart-product">
            <div class="cart-product-art">
              {{ productInitials(i.product.name) }}
            </div>
            <div>
              <strong>{{ i.product.name }}</strong>
              <div>{{ i.product.category || ('store.supermarket' | t) }}</div>
              <small>{{ 'cart.productNumber' | t }} #{{ i.product.id }}<span *ngIf="i.id"> · {{ 'cart.cartItemNumber' | t }} #{{ i.id }}</span></small>
              <span>
                {{ unitPrice(i.product) | currency }} {{ 'cart.each' | t }}
                <em *ngIf="itemPromotionSavings(i) > 0">{{ 'cart.saved' | t }} {{ itemPromotionSavings(i) | currency }}</em>
              </span>
            </div>
          </div>

          <div class="quantity-control" [attr.aria-label]="'store.quantity' | t">
            <button type="button" (click)="decrease(i.product.id, i.quantity)">-</button>
            <input
              type="number"
              min="1"
              [ngModel]="i.quantity"
              (ngModelChange)="update(i.product.id, $event)"
            />
            <button type="button" (click)="increase(i.product.id, i.quantity)">+</button>
          </div>

          <strong class="line-total">{{ unitPrice(i.product) * i.quantity | currency }}</strong>

          <button class="remove-button icon-button" type="button" (click)="remove(i.product.id)" [attr.aria-label]="'cart.removeItem' | t">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M6 6l1 15h10l1-15" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </button>
        </article>
      </div>

      <aside class="cart-summary-card">
        <div>
          <p class="eyebrow">{{ 'common.summary' | t }}</p>
          <h2>{{ 'cart.orderSummary' | t }}</h2>
          <p class="summary-note top-note">{{ 'cart.secureCheckout' | t }}</p>
        </div>

        <div class="cart-summary-items" [attr.aria-label]="'cart.selectedProducts' | t">
          <div class="cart-summary-item" *ngFor="let i of items">
            <div>
              <strong>{{ i.product.name }}</strong>
              <span>
                {{ 'cart.qty' | t }} {{ i.quantity }} x {{ unitPrice(i.product) | currency }}
                <em *ngIf="itemPromotionSavings(i) > 0">{{ 'cart.promo' | t }} -{{ itemPromotionSavings(i) | currency }}</em>
              </span>
            </div>
            <strong>{{ unitPrice(i.product) * i.quantity | currency }}</strong>
          </div>
        </div>

        <div class="summary-row">
          <span>{{ 'common.items' | t }}</span>
          <strong>{{ itemCount }}</strong>
        </div>
        <div class="summary-row">
          <span>{{ 'common.subtotal' | t }}</span>
          <strong>{{ originalSubtotal | currency }}</strong>
        </div>
        <div class="summary-row promotion-row" *ngIf="promotionSavings > 0">
          <span>{{ 'common.promotions' | t }}</span>
          <strong>-{{ promotionSavings | currency }}</strong>
        </div>
        <div class="summary-row">
          <span>{{ 'common.shipping' | t }}</span>
          <strong>{{ 'cart.checkout' | t }}</strong>
        </div>
        <div class="summary-row total-row">
          <span>{{ 'common.total' | t }}</span>
          <strong>{{ subtotal | currency }}</strong>
        </div>

        <a class="button checkout-cta" routerLink="/checkout">
          {{ 'cart.checkout' | t }}
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </a>
        <p class="summary-note">{{ 'cart.taxesNote' | t }}</p>
      </aside>
    </div>
  </section>
  `
})
export class CartComponent implements OnInit {
  cart$ = this.cart.cart$
  subtotal = 0
  originalSubtotal = 0
  promotionSavings = 0
  itemCount = 0

  constructor(private cart: CartService, private auth: AuthService) {
    this.cart$.subscribe(() => {
      this.subtotal = this.cart.subtotal()
      this.originalSubtotal = this.cart.originalSubtotal()
      this.promotionSavings = this.cart.promotionSavings()
      this.itemCount = this.cart.itemCount()
    })
  }

  ngOnInit() {
    if (this.auth.getToken()) {
      this.cart.loadBackendCart().subscribe()
    }
  }

  update(productId: number, qty: any) {
    const q = Number(qty)
    if (q > 0) this.cart.updateQuantity(productId, q)
  }

  increase(productId: number, qty: number) {
    this.cart.updateQuantity(productId, qty + 1)
  }

  decrease(productId: number, qty: number) {
    this.cart.updateQuantity(productId, qty - 1)
  }

  remove(productId: number) { this.cart.removeItem(productId) }

  itemPromotionSavings(item: { product: { price: number; finalPrice?: number }; quantity: number }): number {
    const finalPrice = this.unitPrice(item.product)
    return Math.max(0, (item.product.price - finalPrice) * item.quantity)
  }

  unitPrice(product: { price: number; finalPrice?: number }): number {
    return Number(product.finalPrice ?? product.price)
  }

  productInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
}
