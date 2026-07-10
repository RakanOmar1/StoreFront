import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, RouterModule } from '@angular/router'
import { TranslatePipe } from '../../core/i18n/translate.pipe'

type ConfirmationState = {
  fullName?: string
  total?: number
  orderId?: number
  status?: string
  paymentStatus?: string
  paymentMethod?: string
  deliveryType?: string
  deliveryAddress?: string | null
  message?: string
}

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <section class="confirmation-page">
      <div class="confirmation-card">
        <div class="confirmation-icon">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m5 12 4 4L19 6" />
          </svg>
        </div>

        <p class="eyebrow">{{ 'confirmation.orderConfirmed' | t }}</p>
          <h1>{{ 'confirmation.thankYou' | t: { name: fullName ? ', ' + fullName : '' } }}</h1>
        <p class="muted">{{ message || ('confirmation.defaultMessage' | t) }}</p>

        <div class="confirmation-details">
          <div *ngIf="orderId">
            <span>{{ 'confirmation.orderId' | t }}</span>
            <strong>#{{ orderId }}</strong>
          </div>
          <div>
            <span>{{ 'confirmation.orderTotal' | t }}</span>
            <strong>{{ total | currency }}</strong>
          </div>
          <div *ngIf="status">
            <span>{{ 'common.status' | t }}</span>
            <strong>{{ status }}</strong>
          </div>
          <div *ngIf="paymentStatus">
            <span>{{ 'common.payment' | t }}</span>
            <strong>{{ paymentStatus }} · {{ paymentMethod }}</strong>
          </div>
          <div *ngIf="deliveryType">
            <span>{{ 'checkout.delivery' | t }}</span>
            <strong>{{ deliveryType }}</strong>
          </div>
          <div *ngIf="deliveryAddress">
            <span>{{ 'checkout.address' | t }}</span>
            <strong>{{ deliveryAddress }}</strong>
          </div>
        </div>

        <a routerLink="/" class="button">{{ 'cart.continueShopping' | t }}</a>
      </div>
    </section>
  `
})
export class OrderConfirmationComponent {
  fullName = ''
  total = 0
  orderId?: number
  status = ''
  paymentStatus = ''
  paymentMethod = ''
  deliveryType = ''
  deliveryAddress = ''
  message = ''

  constructor(private router: Router) {
    const state = this.router.getCurrentNavigation()?.extras.state as ConfirmationState | undefined

    this.fullName = state?.fullName || ''
    this.total = Number(state?.total) || 0
    this.orderId = state?.orderId
    this.status = state?.status || ''
    this.paymentStatus = state?.paymentStatus || ''
    this.paymentMethod = state?.paymentMethod || ''
    this.deliveryType = state?.deliveryType || ''
    this.deliveryAddress = state?.deliveryAddress || ''
    this.message = state?.message || ''
  }
}
