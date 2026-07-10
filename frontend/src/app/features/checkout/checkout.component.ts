import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { switchMap } from 'rxjs/operators'
import { DropdownModule } from 'primeng/dropdown'
import { AuthService } from '../../core/services/auth.service'
import { CartService } from '../../core/services/cart.service'
import { OrderService } from '../../core/services/order.service'
import { SelectOption } from '../../shared/interfaces/select-option'
import { TranslatePipe } from '../../core/i18n/translate.pipe'
import { TranslationService } from '../../core/i18n/translation.service'

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DropdownModule, TranslatePipe],
  template: `
  <section class="checkout">
    <div class="page-heading">
      <p class="eyebrow">{{ 'checkout.eyebrow' | t }}</p>
      <h1>{{ 'checkout.title' | t }}</h1>
      <p class="muted">{{ 'checkout.subtitle' | t }}</p>
    </div>

    <div *ngIf="success" class="success">
      <div>
        <strong>{{ 'checkout.success' | t }}</strong>
        <p>{{ 'checkout.submitted' | t }}</p>
      </div>
      <a routerLink="/">{{ 'cart.continueShopping' | t }}</a>
    </div>

    <div *ngIf="!success && items.length === 0" class="empty">
      {{ 'cart.empty' | t }}
      <a routerLink="/">{{ 'cart.browseProducts' | t }}</a>
    </div>

    <form class="checkout-card" *ngIf="!success && items.length > 0" [formGroup]="f" (ngSubmit)="submit()">
      <div class="checkout-form">
        <h2>{{ 'checkout.deliveryDetails' | t }}</h2>

        <div class="form-grid">
          <label>{{ 'checkout.fullName' | t }}
            <input formControlName="fullName" placeholder="Ada Lovelace" />
            <span *ngIf="f.controls.fullName.invalid && f.controls.fullName.touched">{{ 'checkout.nameRequired' | t }}</span>
          </label>

          <label>{{ 'checkout.phone' | t }}
            <input formControlName="phone" placeholder="050-123-4567" />
            <span *ngIf="f.controls.phone.invalid && f.controls.phone.touched">{{ 'checkout.phoneRequired' | t }}</span>
          </label>

          <label class="span-2">{{ 'checkout.address' | t }}
            <input formControlName="address" placeholder="123 Market Street" />
            <span *ngIf="f.controls.address.invalid && f.controls.address.touched">{{ 'checkout.addressRequired' | t }}</span>
          </label>

          <label>{{ 'checkout.city' | t }}
            <input formControlName="city" placeholder="Jerusalem" />
          </label>

          <label>
            {{ 'checkout.deliveryType' | t }}
            <p-dropdown
              formControlName="deliveryType"
              [options]="deliveryOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select delivery type"
              appendTo="body"
              styleClass="app-dropdown"
            />
          </label>

          <label>
            {{ 'checkout.paymentMethod' | t }}
            <p-dropdown
              formControlName="paymentMethod"
              [options]="paymentOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select payment method"
              appendTo="body"
              styleClass="app-dropdown"
            />
          </label>
        </div>
      </div>

      <aside class="checkout-summary">
        <div>
          <p class="eyebrow">{{ 'common.summary' | t }}</p>
          <h2>{{ 'checkout.orderSummary' | t }}</h2>
          <p class="summary-note top-note">{{ 'checkout.confirmItems' | t }}</p>
        </div>

        <div class="summary-item" *ngFor="let item of items">
          <span>
            {{ item.product.name }} x {{ item.quantity }}
            <em *ngIf="itemPromotionSavings(item) > 0">Promo -{{ itemPromotionSavings(item) | currency }}</em>
          </span>
          <strong>{{ unitPrice(item.product) * item.quantity | currency }}</strong>
        </div>

        <div class="summary-row summary-divider">
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
          <strong>{{ f.controls.deliveryType.value === 'PICKUP' ? ('checkout.pickup' | t) : ('checkout.delivery' | t) }}</strong>
        </div>
        <div class="summary-row">
          <span>{{ 'common.payment' | t }}</span>
          <strong>{{ f.controls.paymentMethod.value }}</strong>
        </div>

        <div class="summary-total">
          <span>{{ 'common.total' | t }}</span>
          <strong>{{ subtotal | currency }}</strong>
        </div>

        <div *ngIf="error" class="error">{{ error }}</div>

        <button class="place-order-button" type="submit" [disabled]="f.invalid || submitting">
          <span>{{ submitting ? ('checkout.placingOrder' | t) : ('checkout.placeOrder' | t) }}</span>
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
  deliveryOptions: SelectOption<'DELIVERY' | 'PICKUP'>[] = [
    { value: 'DELIVERY', label: 'Delivery' },
    { value: 'PICKUP', label: 'Pickup' }
  ]
  paymentOptions: SelectOption<'CASH' | 'ONLINE'>[] = [
    { value: 'CASH', label: 'Cash' },
    { value: 'ONLINE', label: 'Online' }
  ]
  items = this.cart.getItems()
  subtotal = this.cart.subtotal()
  originalSubtotal = this.cart.originalSubtotal()
  promotionSavings = this.cart.promotionSavings()
  itemCount = this.cart.itemCount()
  submitting = false
  success = false
  error: string | null = null
  private user = this.auth.getCurrentUser()

  f = this.fb.group({
    fullName: [this.checkoutName(), [Validators.required, Validators.minLength(3)]],
    phone: [this.user?.phone || '', Validators.required],
    address: [this.user?.address || '', Validators.minLength(5)],
    city: [this.user?.city || ''],
    deliveryType: ['DELIVERY' as 'DELIVERY' | 'PICKUP', Validators.required],
    paymentMethod: ['CASH' as 'CASH' | 'ONLINE', Validators.required]
  })

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private cart: CartService,
    private orderService: OrderService,
    private router: Router,
    private i18n: TranslationService
  ) {
    this.cart.cart$.subscribe(items => {
      this.items = items
      this.subtotal = this.cart.subtotal()
      this.originalSubtotal = this.cart.originalSubtotal()
      this.promotionSavings = this.cart.promotionSavings()
      this.itemCount = this.cart.itemCount()
    })
  }

  private checkoutName(): string {
    if (this.user?.name) {
      return this.user.name
    }

    return [this.user?.firstname, this.user?.lastname].filter(Boolean).join(' ')
  }

  itemPromotionSavings(item: { product: { price: number; finalPrice?: number }; quantity: number }): number {
    const finalPrice = this.unitPrice(item.product)
    return Math.max(0, (item.product.price - finalPrice) * item.quantity)
  }

  unitPrice(product: { price: number; finalPrice?: number }): number {
    return Number(product.finalPrice ?? product.price)
  }

  submit() {
    const customer = this.f.getRawValue()
    const needsAddress = customer.deliveryType === 'DELIVERY'

    if (this.f.invalid || this.items.length === 0 || (needsAddress && (!customer.address || !customer.city))) {
      this.f.markAllAsTouched()
      if (needsAddress && (!customer.address || !customer.city)) {
        this.error = this.i18n.translate('checkout.addressCityRequired')
      }
      return
    }

    const user = this.auth.getCurrentUser()

    if (!user?.id) {
      this.router.navigate(['/auth/login'])
      return
    }

    this.submitting = true
    this.error = null
    const orderTotal = this.subtotal
    const checkoutPayload = {
      paymentMethod: customer.paymentMethod || 'CASH',
      deliveryType: customer.deliveryType || 'DELIVERY',
      deliveryAddress: customer.deliveryType === 'DELIVERY'
        ? `${customer.address}, ${customer.city}`
        : undefined
    }

    this.cart.syncToBackend().pipe(
      switchMap(() => this.orderService.checkoutWithFallback(user.id as number, this.items, checkoutPayload))
    ).subscribe({
      next: result => {
        this.cart.clear()
        this.items = []
        this.subtotal = 0
        this.submitting = false
        this.router.navigate(['/confirmation'], {
          state: {
            fullName: customer.fullName,
            total: result.order.total_amount || orderTotal,
            orderId: result.order.id,
            status: result.order.status,
            paymentStatus: result.order.payment_status,
            paymentMethod: result.order.payment_method,
            deliveryType: result.order.delivery_type,
            deliveryAddress: result.order.delivery_address,
            message: result.message
          }
        })
      },
      error: () => {
        this.error = this.i18n.translate('checkout.placeOrderError')
        this.submitting = false
      }
    })
  }
}
