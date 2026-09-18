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
        [quantity]="cartQuantities[product.id] || 0"
        [added]="addedProductId === product.id"
        (addToCart)="addToCart.emit($event)"
      ></app-product-card>
    </div>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .product-grid { min-width: 0; align-items: stretch; }
    @media (max-width: 479px) {
      .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .625rem; }
    }
    @media (min-width: 480px) and (max-width: 767px) {
      .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .875rem; }
    }
    @media (min-width: 768px) and (max-width: 1099px) {
      .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  `]
})
export class ProductGridComponent {
  @Input() products: Product[] = []
  @Input() cartQuantities: Record<number, number> = {}
  @Input() addedProductId?: number
  @Output() addToCart = new EventEmitter<Product>()

  trackProduct(index: number, product: Product): number {
    return product.id
  }
}
