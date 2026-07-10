import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, RouterModule } from '@angular/router'
import { Product } from '../../shared/interfaces/product'
import { TranslatePipe } from '../../core/i18n/translate.pipe'

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="product-card"
      [class.has-promotion]="hasDiscount"
      role="link"
      tabindex="0"
      (click)="openProduct()"
      (keydown.enter)="openProduct()"
      (keydown.space)="openProduct(); $event.preventDefault()"
      [attr.aria-label]="product.name"
    >
      <div class="product-hero" [ngClass]="toneClass">
        <span class="product-status">{{ hasDiscount ? promotionLabel : ('store.newArrivals' | t) }}</span>
        <button class="favorite-button" type="button" [attr.aria-label]="'store.addToWishlist' | t" (click)="$event.stopPropagation()">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
          </svg>
        </button>

        <a class="product-qty-badge" *ngIf="quantity > 0" routerLink="/cart" [attr.aria-label]="'store.openCart' | t" (click)="$event.stopPropagation()">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 5h2l1.5 9.5h8.7L20 8H8" />
            <circle cx="10" cy="19" r="1.5" />
            <circle cx="17" cy="19" r="1.5" />
          </svg>
          <span>{{ quantity }}</span>
        </a>

        <a class="product-art product-image-link" [routerLink]="['/products', product.id]" (click)="$event.stopPropagation()">
          <img [src]="product.url" [alt]="product.name" />
        </a>
      </div>

      <div class="product-info">
        <div class="product-meta-row">
          <p class="product-category">{{ product.category || ('store.supermarket' | t) }}</p>
          <span class="product-rating" aria-label="Rated 4.8 out of 5">&#9733; 4.8</span>
        </div>
        <h2><a [routerLink]="['/products', product.id]" (click)="$event.stopPropagation()">{{ product.name }}</a></h2>
        <p class="product-description">{{ product.description }}</p>
        <div class="product-footer">
          <div class="product-price">
            <span>{{ hasDiscount ? 'Sale price' : ('store.price' | t) }}</span>
            <div class="price-values">
              <del *ngIf="hasDiscount">{{ product.price | currency }}</del>
              <strong>{{ displayPrice | currency }}</strong>
            </div>
            <small *ngIf="hasDiscount">Save {{ savings | currency }}</small>
          </div>
          <button class="add-cart-button" type="button" (click)="add($event)">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 5h2l1.5 9.5h8.7L20 8H8" />
              <circle cx="10" cy="19" r="1.5" />
              <circle cx="17" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  `
})
export class ProductCardComponent implements OnChanges {
  @Input({ required: true }) product!: Product
  @Input() quantity = 0
  @Input() added = false
  @Output() addToCart = new EventEmitter<Product>()
  toneClass = 'tone-default'

  constructor(private router: Router) {}

  ngOnChanges() {
    this.toneClass = this.categoryTone()
  }

  get displayPrice(): number {
    return Number(this.product.finalPrice ?? this.product.price)
  }

  get savings(): number {
    return Math.max(0, Number(this.product.price) - this.displayPrice)
  }

  get hasDiscount(): boolean {
    return !!this.product.promotion?.is_active && this.savings >= 0.01
  }

  get promotionLabel(): string {
    const promo = this.product.promotion

    if (!promo) {
      return 'Offer'
    }

    return promo.type === 'PERCENT' ? `${promo.value}% off` : `${this.money(this.savings)} off`
  }

  private money(value: number): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value || 0))
  }

  openProduct() {
    this.router.navigate(['/products', this.product.id])
  }

  add(event: Event) {
    event.stopPropagation()
    this.openProduct()
  }

  categoryTone(): string {
    const category = (this.product.category || 'default').toLowerCase()

    return ['running', 'lifestyle', 'trail', 'training', 'casual', 'boots', 'fresh', 'produce', 'bakery', 'dairy', 'pantry', 'drinks', 'household', 'cleaning', 'personal', 'frozen'].includes(category)
      ? `tone-${category}`
      : 'tone-default'
  }
}
