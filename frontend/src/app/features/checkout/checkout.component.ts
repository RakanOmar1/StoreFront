import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Subject, takeUntil } from 'rxjs'
import { Router, RouterModule } from '@angular/router'
import { switchMap } from 'rxjs/operators'
import { DropdownModule } from 'primeng/dropdown'
import { AuthService } from '../../core/services/auth.service'
import { CartService } from '../../core/services/cart.service'
import { OrderService } from '../../core/services/order.service'
import { SelectOption } from '../../shared/interfaces/select-option'
import { TranslatePipe } from '../../core/i18n/translate.pipe'
import { TranslationService } from '../../core/i18n/translation.service'
import { OpenStreetMapPickerComponent } from '../../shared/openstreet-map-picker.component'
import { MapPoint, OpenStreetMapService, ResolvedMapLocation } from '../../core/services/openstreet-map.service'

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DropdownModule, TranslatePipe, OpenStreetMapPickerComponent],
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

          <div *ngIf="f.controls.deliveryType.value === 'DELIVERY'" class="checkout-location span-2">
            <button type="button" class="checkout-location-button" (click)="openLocationPicker()" [disabled]="locatingAddress">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              {{ locatingAddress ? ('checkout.loadingLocation' | t) : (hasOrderLocation ? ('checkout.changeLocation' | t) : ('checkout.chooseLocation' | t)) }}
            </button>
            <p>{{ 'checkout.orderOnlyLocation' | t }}</p>
          </div>

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
            <strong>{{ item.product.name }}</strong>
            <small>{{ 'cart.qty' | t }} {{ item.quantity }} x {{ unitPrice(item.product) | currency }}</small>
            <em *ngIf="itemPromotionSavings(item) > 0">Promo -{{ itemPromotionSavings(item) | currency }}</em>
            <small *ngIf="bundleLabel(item.product)" class="bundle-offer-line">{{ bundleLabel(item.product) }}</small>
          </span>
          <strong>{{ lineTotal(item) | currency }}</strong>
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
    <app-openstreet-map-picker
      *ngIf="locationPickerOpen"
      [initialPoint]="locationPickerPoint"
      [rtl]="i18n.currentLanguage === 'ar'"
      (selectedLocation)="applyOrderLocation($event)"
      (cancel)="locationPickerOpen = false"
    />
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
    { value: 'ONLINE', label: 'Online (payment remains pending)' }
  ]
  items = this.cart.getItems()
  subtotal = this.cart.subtotal()
  originalSubtotal = this.cart.originalSubtotal()
  promotionSavings = this.cart.promotionSavings()
  itemCount = this.cart.itemCount()
  submitting = false
  success = false
  error: string | null = null
  locationPickerOpen = false
  locatingAddress = false
  private user = this.auth.getCurrentUser()
  locationPickerPoint: MapPoint = this.user?.latitude != null && this.user?.longitude != null
    ? { lat: this.user.latitude, lng: this.user.longitude }
    : { lat: 31.9038, lng: 35.2034 }
  selectedOrderPoint: MapPoint | null = this.user?.latitude != null && this.user?.longitude != null
    ? { lat: this.user.latitude, lng: this.user.longitude }
    : null
  private readonly destroy$ = new Subject<void>()

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
    public i18n: TranslationService,
    private locations: OpenStreetMapService
  ) {
    this.cart.cart$.pipe(takeUntil(this.destroy$)).subscribe(items => {
      this.items = items
      this.subtotal = this.cart.subtotal()
      this.originalSubtotal = this.cart.originalSubtotal()
      this.promotionSavings = this.cart.promotionSavings()
      this.itemCount = this.cart.itemCount()
    })

    this.f.controls.deliveryType.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(type => {
      this.updateDeliveryValidators(type === 'DELIVERY')
      if (type === 'DELIVERY' && !this.hasOrderLocation) {
        window.setTimeout(() => this.openLocationPicker(), 0)
      }
    })
    this.updateDeliveryValidators(this.f.controls.deliveryType.value === 'DELIVERY')

    if (!this.hasOrderLocation) {
      window.setTimeout(() => this.openLocationPicker(), 0)
    }
  }

  get hasOrderLocation(): boolean {
    return Boolean(this.f.controls.address.value?.trim() && this.f.controls.city.value?.trim())
  }

  async openLocationPicker(): Promise<void> {
    if (this.locationPickerOpen || this.locatingAddress) return

    const address = this.f.controls.address.value?.trim()
    const city = this.f.controls.city.value?.trim()
    const savedLocation = [address, city].filter(Boolean).join(', ')

    if (savedLocation) {
      this.locatingAddress = true
      try {
        const location = await this.locations.geocodeAddress(savedLocation, this.i18n.currentLanguage)
        this.locationPickerPoint = { lat: location.lat, lng: location.lng }
      } catch {
        // Keep Ramallah as the safe map fallback when a saved address cannot be resolved.
      } finally {
        this.locatingAddress = false
      }
    }

    this.locationPickerOpen = true
  }

  applyOrderLocation(location: ResolvedMapLocation): void {
    this.f.patchValue({ address: location.address, city: location.city })
    this.f.controls.address.markAsTouched()
    this.f.controls.city.markAsTouched()
    this.locationPickerPoint = { lat: location.lat, lng: location.lng }
    this.selectedOrderPoint = { lat: location.lat, lng: location.lng }
    this.locationPickerOpen = false
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private updateDeliveryValidators(required: boolean) {
    const addressValidators = required ? [Validators.required, Validators.minLength(5)] : []
    const cityValidators = required ? [Validators.required] : []
    this.f.controls.address.setValidators(addressValidators)
    this.f.controls.city.setValidators(cityValidators)
    this.f.controls.address.updateValueAndValidity({ emitEvent: false })
    this.f.controls.city.updateValueAndValidity({ emitEvent: false })
  }

  private checkoutName(): string {
    if (this.user?.name) {
      return this.user.name
    }

    return [this.user?.firstname, this.user?.lastname].filter(Boolean).join(' ')
  }

  itemPromotionSavings(item: { product: any; quantity: number }): number {
    return this.cart.itemPromotionSavings(item)
  }

  lineTotal(item: { product: any; quantity: number }): number {
    return this.cart.lineTotal(item)
  }

  bundleLabel(product: any): string {
    const promotion = product?.promotion

    if (!promotion?.is_active || promotion.type !== 'BUNDLE') {
      return ''
    }

    return this.i18n.translate('cart.bundleOffer', {
      quantity: promotion.bundle_quantity || 0,
      price: this.money(promotion.bundle_price || 0)
    })
  }

  private money(value: number): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value || 0))
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
        : undefined,
      deliveryLatitude: customer.deliveryType === 'DELIVERY' ? this.selectedOrderPoint?.lat : undefined,
      deliveryLongitude: customer.deliveryType === 'DELIVERY' ? this.selectedOrderPoint?.lng : undefined
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
