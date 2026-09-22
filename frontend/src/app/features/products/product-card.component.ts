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
      [class.has-promotion]="hasPromotion"
      [attr.aria-label]="product.name"
    >
      <div class="product-hero" [ngClass]="toneClass">
        <span class="product-status">{{ hasPromotion ? promotionLabel : ('store.newArrivals' | t) }}</span>
        <button class="favorite-button" type="button" [attr.aria-label]="'store.addToWishlist' | t">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
          </svg>
        </button>

        <a class="product-qty-badge" *ngIf="quantity > 0" routerLink="/cart" [attr.aria-label]="'store.openCart' | t">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 5h2l1.5 9.5h8.7L20 8H8" />
            <circle cx="10" cy="19" r="1.5" />
            <circle cx="17" cy="19" r="1.5" />
          </svg>
          <span>{{ quantity }}</span>
        </a>

        <a class="product-art product-image-link" [routerLink]="['/products', product.id]">
          <img [src]="product.url" [alt]="product.name" />
        </a>
      </div>

      <div class="product-info">
        <div class="product-meta-row">
          <span class="product-tags">
            <p class="product-category">{{ product.category || ('store.supermarket' | t) }}</p>
            <span *ngIf="product.brand" class="product-brand-tag"><i class="pi pi-bookmark" aria-hidden="true"></i>{{ product.brand }}</span>
          </span>
          <span class="product-rating" aria-label="Rated 4.8 out of 5">&#9733; 4.8</span>
        </div>
        <h2><a [routerLink]="['/products', product.id]">{{ product.name }}</a></h2>
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
          <button class="add-cart-button" type="button" (click)="add()" [class.added]="added" [attr.aria-label]="'store.addToCart' | t">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 5h2l1.5 9.5h8.7L20 8H8" />
              <circle cx="10" cy="19" r="1.5" />
              <circle cx="17" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .product-card { height: 100%; min-width: 0; overflow: hidden; cursor: default; }
    .product-image-link { display: flex; min-width: 0; }
    .product-image-link:focus-visible,
    h2 a:focus-visible,
    button:focus-visible,
    .product-qty-badge:focus-visible { outline: 3px solid var(--focus-ring, #f59e0b); outline-offset: 3px; }
    .product-info, .product-meta-row, .product-footer { min-width: 0; }
    .product-tags { align-items:center; display:flex; flex-wrap:wrap; gap:5px; min-width:0; }
    .product-brand-tag { align-items:center; background:#fff3df; border:1px solid #f1d8ad; border-radius:999px; color:#86500c; display:inline-flex; font-size:.58rem; font-weight:800; gap:3px; max-width:100%; overflow:hidden; padding:3px 6px; text-overflow:ellipsis; white-space:nowrap; }
    .product-brand-tag i { font-size:.55rem; }
    h2, .product-description, .product-category { overflow-wrap: anywhere; }
    .add-cart-button.added { background: #166534; transform: scale(.96); }
    @media (max-width: 479px) {
      .product-footer { align-items: flex-end; gap: .5rem; }
      .product-price { min-width: 0; }
      .price-values { flex-wrap: wrap; }
    }
    @media (prefers-reduced-motion: reduce) {
      .product-card, .product-art, .add-cart-button { transition: none !important; }
    }
  `]
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
    return !!this.product.promotion?.is_active && this.product.promotion.type !== 'BUNDLE' && this.savings >= 0.01
  }

  get hasPromotion(): boolean {
    return this.hasDiscount || this.isBundlePromotion
  }

  get isBundlePromotion(): boolean {
    return !!this.product.promotion?.is_active && this.product.promotion.type === 'BUNDLE'
  }

  get promotionLabel(): string {
    const promo = this.product.promotion

    if (!promo) {
      return 'Offer'
    }

    if (promo.type === 'BUNDLE') {
      return `${promo.bundle_quantity || 1} for ${this.money(promo.bundle_price || 0)}`
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

  add() {
    this.addToCart.emit(this.product)
  }

  categoryTone(): string {
    const category = (this.product.category || 'default').toLowerCase()

    return ['running', 'lifestyle', 'trail', 'training', 'casual', 'boots', 'fresh', 'produce', 'bakery', 'dairy', 'pantry', 'drinks', 'household', 'cleaning', 'personal', 'frozen'].includes(category)
      ? `tone-${category}`
      : 'tone-default'
  }
}
