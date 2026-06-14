import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { ProductService } from '../../core/services/product.service'
import { Product } from '../../shared/interfaces/product'
import { CartService } from '../../core/services/cart.service'
import { ProductItemComponent } from './product-item.component'

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProductItemComponent],
  template: `
  <section class="products-page">
    <div class="products-header">
      <div class="page-heading">
        <p class="eyebrow">Shoe store</p>
        <h1>Find your next pair</h1>
        <p class="muted">Shop running, lifestyle, and boots from the database.</p>
      </div>

      <div class="category-tabs" aria-label="Product categories">
        <button type="button" [class.active]="selectedCategory === 'all'" (click)="selectCategory('all')">All</button>
        <button
          type="button"
          *ngFor="let category of categories"
          [class.active]="selectedCategory === category"
          (click)="selectCategory(category)"
        >
          {{ category }}
        </button>
      </div>
    </div>

    <div class="filters-card" *ngIf="!loading && !error">
      <label>
        Search
        <input type="search" [(ngModel)]="searchTerm" placeholder="Search shoes..." />
      </label>

      <label>
        Max price: {{ priceLimit | currency }}
        <input type="range" min="0" [max]="maxProductPrice" step="5" [(ngModel)]="priceLimit" />
      </label>

      <button type="button" (click)="clearFilters()">Clear filters</button>
    </div>

    <div *ngIf="loading" class="state-card">Loading products...</div>
    <div *ngIf="error" class="state-card error">{{ error }}</div>
    <div *ngIf="!loading && !error && filteredProducts.length === 0" class="state-card">No shoes match these filters.</div>

    <div class="product-grid" *ngIf="!loading && !error && filteredProducts.length > 0">
      <app-product-item
        *ngFor="let p of filteredProducts"
        [product]="p"
        [quantity]="productCartQuantity(p)"
        [added]="addedProductId === p.id"
        (addToCart)="add($event)"
      ></app-product-item>
    </div>
  </section>
  `
})
export class ProductListComponent implements OnInit {
  products: Product[] = []
  categories = ['running', 'lifestyle', 'boots']
  selectedCategory = 'all'
  searchTerm = ''
  priceLimit = 0
  loading = false
  error: string | null = null
  addedProductId?: number
  cartQuantities: Record<number, number> = {}

  constructor(private productService: ProductService, private cart: CartService) {}

  ngOnInit() {
    this.cart.cart$.subscribe(items => {
      this.cartQuantities = items.reduce<Record<number, number>>((quantities, item) => {
        if (item.product.id) {
          quantities[item.product.id] = item.quantity
        }

        return quantities
      }, {})
    })

    this.loading = true
    this.productService.getProducts().subscribe({
      next: p => {
        this.products = p
        this.priceLimit = this.maxProductPrice
        this.loading = false
      },
      error: e => { this.error = 'Could not load products'; this.loading = false }
    })
  }

  get maxProductPrice(): number {
    return Math.max(0, ...this.products.map(product => product.price))
  }

  get filteredProducts(): Product[] {
    const search = this.searchTerm.trim().toLowerCase()

    return this.products.filter(product => {
      const matchesSearch = !search || product.name.toLowerCase().includes(search)
      const matchesCategory = this.selectedCategory === 'all' || product.category === this.selectedCategory
      const matchesPrice = product.price <= this.priceLimit

      return matchesSearch && matchesCategory && matchesPrice
    })
  }

  selectCategory(category: string) {
    this.selectedCategory = category
  }

  clearFilters() {
    this.searchTerm = ''
    this.selectedCategory = 'all'
    this.priceLimit = this.maxProductPrice
  }

  add(product: Product) {
    this.cart.addToCart(product, 1)
    this.addedProductId = product.id
    window.setTimeout(() => {
      if (this.addedProductId === product.id) {
        this.addedProductId = undefined
      }
    }, 1200)
  }

  productCartQuantity(product: Product): number {
    return this.cartQuantities[product.id] || 0
  }
}
