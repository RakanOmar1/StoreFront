import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Product } from '../../shared/interfaces/product'
import { ProductCardComponent } from './product-card.component'

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="product-grid">
      <app-product-card
        *ngFor="let product of products; trackBy: trackProduct"
        [product]="product"
        [quantity]="productCartQuantity(product)"
        [added]="addedProductId === product.id"
        (addToCart)="addToCart.emit($event)"
      ></app-product-card>
    </div>
  `
})
export class ProductGridComponent {
  @Input() products: Product[] = []
  @Input() cartQuantities: Record<number, number> = {}
  @Input() addedProductId?: number
  @Output() addToCart = new EventEmitter<Product>()

  trackProduct(index: number, product: Product): number {
    return product.id
  }

  productCartQuantity(product: Product): number {
    return this.cartQuantities[product.id] || 0
  }
}
