import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { ProductService } from '../../core/services/product.service'
import { CartService } from '../../core/services/cart.service'
import { Product } from '../../shared/interfaces/product'

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <section class="product-detail-page">
    <div *ngIf="loading" class="state-card">Loading product...</div>
    <div *ngIf="error" class="state-card error">{{ error }}</div>

    <article class="product-detail" *ngIf="product">
      <div class="product-art detail-art">
        <img [src]="product.url" [alt]="product.name" />
      </div>

      <div class="detail-copy">
        <a routerLink="/" class="back-link">Back to shoes</a>
        <p class="product-category">{{ product.category || 'Footwear' }}</p>
        <h1>{{ product.name }}</h1>
        <p class="detail-price">{{ product.price | currency }}</p>
        <p class="detail-description">{{ product.description }}</p>

        <label>
          Quantity
          <input type="number" [(ngModel)]="quantity" min="1" />
        </label>

        <button type="button" (click)="add()">
          {{ added ? 'Added to cart' : 'Add to cart' }}
        </button>
      </div>
    </article>
  </section>
  `
})
export class ProductDetailsComponent {
  product: Product | null = null
  loading = false
  error: string | null = null
  quantity = 1
  added = false

  constructor(private route: ActivatedRoute, private productService: ProductService, private cart: CartService) {
    const id = this.route.snapshot.paramMap.get('id')
    if (id) {
      this.loading = true
      this.productService.getProduct(id).subscribe({
        next: p => { this.product = p; this.loading = false },
        error: () => { this.error = 'Could not load product'; this.loading = false }
      })
    }
  }

  add() {
    if (!this.product) {
      return
    }

    this.cart.addToCart(this.product, Number(this.quantity))
    this.added = true
    window.setTimeout(() => this.added = false, 1200)
  }

}
