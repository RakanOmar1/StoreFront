import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { forkJoin, map, switchMap } from 'rxjs'
import { AuthService } from '../../core/services/auth.service'
import { CartService } from '../../core/services/cart.service'
import { OrderService } from '../../core/services/order.service'

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
  <section class="checkout">
    <div class="page-heading">
      <p class="eyebrow">Secure checkout</p>
      <h1>Checkout</h1>
      <p class="muted">Add your delivery details and place the order.</p>
    </div>

    <div *ngIf="success" class="success">
      <div>
        <strong>Order placed successfully.</strong>
        <p>Your cart has been submitted to the backend.</p>
      </div>
      <a routerLink="/">Continue shopping</a>
    </div>

    <div *ngIf="!success && items.length === 0" class="empty">
      Your cart is empty.
      <a routerLink="/">Browse products</a>
    </div>

    <form class="checkout-card" *ngIf="!success && items.length > 0" [formGroup]="f" (ngSubmit)="submit()">
      <div class="checkout-form">
        <h2>Delivery details</h2>

        <div class="form-grid">
          <label>Full Name
            <input formControlName="fullName" placeholder="Ada Lovelace" />
            <span *ngIf="f.controls.fullName.invalid && f.controls.fullName.touched">Name required (min 3)</span>
          </label>

          <label>Phone
            <input formControlName="phone" placeholder="050-123-4567" />
            <span *ngIf="f.controls.phone.invalid && f.controls.phone.touched">Phone required</span>
          </label>

          <label class="span-2">Address
            <input formControlName="address" placeholder="123 Market Street" />
            <span *ngIf="f.controls.address.invalid && f.controls.address.touched">Address required</span>
          </label>

          <label>City
            <input formControlName="city" placeholder="Jerusalem" />
            <span *ngIf="f.controls.city.invalid && f.controls.city.touched">City required</span>
          </label>
        </div>
      </div>

      <aside class="checkout-summary">
        <div>
          <p class="eyebrow">Summary</p>
          <h2>Order summary</h2>
          <p class="summary-note top-note">Confirm your items before placing the order.</p>
        </div>

        <div class="summary-item" *ngFor="let item of items">
          <span>{{ item.product.name }} x {{ item.quantity }}</span>
          <strong>{{ item.product.price * item.quantity | currency }}</strong>
        </div>

        <div class="summary-row summary-divider">
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

        <div class="summary-total">
          <span>Total</span>
          <strong>{{ subtotal | currency }}</strong>
        </div>

        <div *ngIf="error" class="error">{{ error }}</div>

        <button class="place-order-button" type="submit" [disabled]="f.invalid || submitting">
          <span>{{ submitting ? 'Placing order...' : 'Place order' }}</span>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </button>
      </aside>
    </form>
  </section>
  `
})
export class CheckoutComponent {
  items = this.cart.getItems()
  subtotal = this.cart.subtotal()
  itemCount = this.cart.itemCount()
  submitting = false
  success = false
  error: string | null = null

  f = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', Validators.required],
    address: ['', [Validators.required, Validators.minLength(5)]],
    city: ['', Validators.required]
  })

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private cart: CartService,
    private orderService: OrderService,
    private router: Router
  ) {}

  submit() {
    if (this.f.invalid || this.items.length === 0) {
      this.f.markAllAsTouched()
      return
    }

    const user = this.auth.getCurrentUser()

    if (!user?.id) {
      this.router.navigate(['/auth/login'])
      return
    }

    this.submitting = true
    this.error = null
    const customer = this.f.getRawValue()
    const orderTotal = this.subtotal

    this.orderService.createOrder({ user_id: user.id, status: 'active' }).pipe(
      switchMap(order => forkJoin(
        this.items.map(item => this.orderService.addProduct(
          order.id as number,
          item.product.id as number,
          item.quantity
        ))
      ).pipe(map(() => order)))
    ).subscribe({
      next: order => {
        this.cart.clear()
        this.items = []
        this.subtotal = 0
        this.submitting = false
        this.router.navigate(['/confirmation'], {
          state: {
            fullName: customer.fullName,
            total: orderTotal,
            orderId: order.id
          }
        })
      },
      error: () => {
        this.error = 'Could not place order. Please try again.'
        this.submitting = false
      }
    })
  }
}
