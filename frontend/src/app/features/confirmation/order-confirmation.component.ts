import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, RouterModule } from '@angular/router'

type ConfirmationState = {
  fullName?: string
  total?: number
  orderId?: number
}

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="confirmation-page">
      <div class="confirmation-card">
        <div class="confirmation-icon">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m5 12 4 4L19 6" />
          </svg>
        </div>

        <p class="eyebrow">Order confirmed</p>
        <h1>Thank you{{ fullName ? ', ' + fullName : '' }}!</h1>
        <p class="muted">Your SoleStreet order was placed successfully.</p>

        <div class="confirmation-details">
          <div *ngIf="orderId">
            <span>Order ID</span>
            <strong>#{{ orderId }}</strong>
          </div>
          <div>
            <span>Order total</span>
            <strong>{{ total | currency }}</strong>
          </div>
        </div>

        <a routerLink="/" class="button">Continue shopping</a>
      </div>
    </section>
  `
})
export class OrderConfirmationComponent {
  fullName = ''
  total = 0
  orderId?: number

  constructor(private router: Router) {
    const state = this.router.getCurrentNavigation()?.extras.state as ConfirmationState | undefined

    this.fullName = state?.fullName || ''
    this.total = Number(state?.total) || 0
    this.orderId = state?.orderId
  }
}
