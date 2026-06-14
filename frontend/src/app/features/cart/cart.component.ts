import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { CartService } from '../../core/services/cart.service'

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <section class="cart" *ngIf="(cart$ | async) as items">
    <div class="cart-header">
      <div>
        <p class="eyebrow">Shopping bag</p>
        <h1>Your cart</h1>
        <p class="muted">Review your shoes before moving to secure checkout.</p>
      </div>

      <a routerLink="/" class="continue-link">Continue shopping</a>
    </div>

    <div *ngIf="items.length === 0" class="empty">
      Your cart is empty.
      <a routerLink="/">Browse products</a>
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
              <div>{{ i.product.category || 'Footwear' }}</div>
              <span>{{ i.product.price | currency }} each</span>
            </div>
          </div>

          <div class="quantity-control" aria-label="Quantity">
            <button type="button" (click)="decrease(i.product.id, i.quantity)">-</button>
            <input
              type="number"
              min="1"
              [ngModel]="i.quantity"
              (ngModelChange)="update(i.product.id, $event)"
            />
            <button type="button" (click)="increase(i.product.id, i.quantity)">+</button>
          </div>

          <strong class="line-total">{{ i.product.price * i.quantity | currency }}</strong>

          <button class="remove-button" type="button" (click)="remove(i.product.id)">
            Remove
          </button>
        </article>
      </div>

      <aside class="cart-summary-card">
        <div>
          <p class="eyebrow">Summary</p>
          <h2>Order summary</h2>
          <p class="summary-note top-note">Secure checkout for your SoleStreet order.</p>
        </div>

        <div class="summary-row">
          <span>Items</span>
          <strong>{{ itemCount }}</strong>
        </div>
        <div class="summary-row">
          <span>Subtotal</span>
          <strong>{{ subtotal | currency }}</strong>
        </div>
        <div class="summary-row">
          <span>Shipping</span>
          <strong>At checkout</strong>
        </div>
        <div class="summary-row total-row">
          <span>Total</span>
          <strong>{{ subtotal | currency }}</strong>
        </div>

        <a class="button checkout-cta" routerLink="/checkout">
          Checkout
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </a>
        <p class="summary-note">Taxes and shipping are calculated during checkout.</p>
      </aside>
    </div>
  </section>
  `
})
export class CartComponent {
  cart$ = this.cart.cart$
  subtotal = 0
  itemCount = 0

  constructor(private cart: CartService) {
    this.cart$.subscribe(() => {
      this.subtotal = this.cart.subtotal()
      this.itemCount = this.cart.itemCount()
    })
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

  productInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
}
