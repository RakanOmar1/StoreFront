import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ProductService } from '../../core/services/product.service'
import { Product } from '../../shared/interfaces/product'
import { CartService } from '../../core/services/cart.service'
import { ProductFiltersComponent } from './product-filters.component'
import { ProductGridComponent } from './product-grid.component'
import { ProductHeroComponent } from './product-hero.component'

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductHeroComponent, ProductFiltersComponent, ProductGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <section class="products-page">
    <app-product-hero></app-product-hero>

    <app-product-filters
      *ngIf="filtersLoaded"
      [categories]="categories"
      [selectedCategory]="selectedCategory"
      [searchTerm]="searchTerm"
      [priceLimit]="priceLimit"
      [maxProductPrice]="maxProductPrice"
      (searchTermChange)="updateSearchTerm($event)"
      (priceLimitChange)="updatePriceLimit($event)"
      (categorySelected)="selectCategory($event)"
      (cleared)="clearFilters()"
    ></app-product-filters>

    <div *ngIf="loading && products.length === 0" class="state-card">Loading products...</div>
    <div *ngIf="error" class="state-card error">{{ error }}</div>
    <div *ngIf="!loading && !error && products.length === 0" class="state-card">No shoes match these filters.</div>

    <app-product-grid
      *ngIf="!error && products.length > 0"
      [products]="products"
      [cartQuantities]="cartQuantities"
      [addedProductId]="addedProductId"
      (addToCart)="add($event)"
    ></app-product-grid>

    <div *ngIf="loadingMore" class="state-card loading-more">Loading more products...</div>
  </section>
  `
})
export class ProductListComponent implements OnInit {
  products: Product[] = []
  categories: string[] = []
  selectedCategory = 'all'
  searchTerm = ''
  priceLimit = 0
  maxProductPrice = 0
  filtersLoaded = false
  loading = false
  loadingMore = false
  hasMore = true
  error: string | null = null
  addedProductId?: number
  cartQuantities: Record<number, number> = {}
  private readonly pageSize = 50
  private readonly filterDelayMs = 600
  private filterTimer?: number
  private pendingReset = false

  constructor(
    private productService: ProductService,
    private cart: CartService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cart.cart$.subscribe(items => {
      this.cartQuantities = items.reduce<Record<number, number>>((quantities, item) => {
        if (item.product.id) {
          quantities[item.product.id] = item.quantity
        }

        return quantities
      }, {})
      this.cdr.markForCheck()
    })

    this.loading = true
    this.productService.getProductFilters().subscribe({
      next: filters => {
        this.categories = filters.categories
        this.maxProductPrice = filters.maxPrice
        this.priceLimit = filters.maxPrice
        this.filtersLoaded = true
        this.loading = false
        this.loadProducts(true)
        this.cdr.markForCheck()
      },
      error: () => {
        this.error = 'Could not load product filters'
        this.filtersLoaded = false
        this.loading = false
        this.cdr.markForCheck()
      }
    })
  }

  @HostListener('window:scroll')
  onScroll() {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500

    if (nearBottom) {
      this.loadProducts(false)
    }
  }

  selectCategory(category: string) {
    this.selectedCategory = category
    window.clearTimeout(this.filterTimer)
    this.loadProducts(true)
  }

  updateSearchTerm(searchTerm: string) {
    this.searchTerm = searchTerm
    this.onFilterChange()
  }

  updatePriceLimit(priceLimit: number) {
    this.priceLimit = Number(priceLimit)
    this.onFilterChange()
  }

  onFilterChange() {
    window.clearTimeout(this.filterTimer)
    this.filterTimer = window.setTimeout(() => this.loadProducts(true), this.filterDelayMs)
  }

  clearFilters() {
    this.searchTerm = ''
    this.selectedCategory = 'all'
    this.priceLimit = this.maxProductPrice
    window.clearTimeout(this.filterTimer)
    this.loadProducts(true)
  }

  loadProducts(reset: boolean) {
    if (this.loading || this.loadingMore) {
      if (reset) {
        this.pendingReset = true
      }

      return
    }

    if (!reset && !this.hasMore) {
      return
    }

    if (reset) {
      this.products = []
      this.hasMore = true
      this.loading = true
    } else {
      this.loadingMore = true
    }

    this.error = null
    this.cdr.markForCheck()

    this.productService.getProducts({
      search: this.searchTerm.trim(),
      category: this.selectedCategory,
      maxPrice: this.priceLimit,
      limit: this.pageSize,
      offset: reset ? 0 : this.products.length
    }).subscribe({
      next: products => {
        this.products = reset ? products : [...this.products, ...products]
        this.hasMore = products.length === this.pageSize
        this.loading = false
        this.loadingMore = false
        this.runPendingReset()
        this.cdr.markForCheck()
      },
      error: () => {
        this.error = 'Could not load products'
        this.loading = false
        this.loadingMore = false
        this.runPendingReset()
        this.cdr.markForCheck()
      }
    })
  }

  private runPendingReset() {
    if (!this.pendingReset) {
      return
    }

    this.pendingReset = false
    this.loadProducts(true)
  }

  add(product: Product) {
    this.cart.addToCart(product, 1)
    this.addedProductId = product.id
    this.cdr.markForCheck()
    window.setTimeout(() => {
      if (this.addedProductId === product.id) {
        this.addedProductId = undefined
        this.cdr.markForCheck()
      }
    }, 1200)
  }
}
