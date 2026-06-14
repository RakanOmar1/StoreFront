import { Component, EventEmitter, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { Product } from '../../shared/interfaces/product'

@Component({
  selector: 'app-product-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <article class="product-card">
      <div class="product-qty-badge" *ngIf="quantity > 0" aria-label="Quantity in cart">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 5h2l1.5 9.5h8.7L20 8H8" />
          <circle cx="10" cy="19" r="1.5" />
          <circle cx="17" cy="19" r="1.5" />
        </svg>
        <span>{{ quantity }}</span>
      </div>

      <a class="product-art product-image-link" [routerLink]="['/products', product.id]">
        <img [src]="product.url" [alt]="product.name" />
      </a>

      <div class="product-info">
        <p class="product-category">{{ product.category || 'Footwear' }}</p>
        <h2><a [routerLink]="['/products', product.id]">{{ product.name }}</a></h2>
        <p class="product-description">{{ product.description }}</p>
        <div class="product-footer">
          <strong>{{ product.price | currency }}</strong>
          <button type="button" (click)="addToCart.emit(product)">
            {{ added ? 'Added' : 'Add to cart' }}
          </button>
        </div>
      </div>
    </article>
  `
})
export class ProductItemComponent {
  @Input({ required: true }) product!: Product
  @Input() quantity = 0
  @Input() added = false
  @Output() addToCart = new EventEmitter<Product>()
}
