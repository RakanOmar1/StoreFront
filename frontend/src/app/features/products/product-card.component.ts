import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { Product } from '../../shared/interfaces/product'

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="product-card">
      <div class="product-hero" [ngClass]="categoryTone()">
        <span class="product-status">New arrival</span>
        <button class="favorite-button" type="button" aria-label="Add to favorites">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
          </svg>
        </button>

        <a class="product-qty-badge" *ngIf="quantity > 0" routerLink="/cart" aria-label="Open cart">
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
          <p class="product-category">{{ product.category || 'Footwear' }}</p>
          <span class="product-rating" aria-label="Rated 4.8 out of 5">&#9733; 4.8</span>
        </div>
        <h2><a [routerLink]="['/products', product.id]">{{ product.name }}</a></h2>
        <p class="product-description">{{ product.description }}</p>
        <div class="product-footer">
          <div class="product-price">
            <span>Price</span>
            <strong>{{ product.price | currency }}</strong>
          </div>
          <button class="add-cart-button" type="button" (click)="addToCart.emit(product)">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 5h2l1.5 9.5h8.7L20 8H8" />
              <circle cx="10" cy="19" r="1.5" />
              <circle cx="17" cy="19" r="1.5" />
            </svg>
            {{ added ? 'Added' : 'Add to cart' }}
          </button>
        </div>
      </div>
    </article>
  `
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product
  @Input() quantity = 0
  @Input() added = false
  @Output() addToCart = new EventEmitter<Product>()

  categoryTone(): string {
    const category = (this.product.category || 'default').toLowerCase()

    return ['running', 'lifestyle', 'trail', 'training', 'casual', 'boots'].includes(category)
      ? `tone-${category}`
      : 'tone-default'
  }
}
