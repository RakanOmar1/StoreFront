import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { ButtonModule } from 'primeng/button'
import { CarouselModule } from 'primeng/carousel'
import { TagModule } from 'primeng/tag'
import { ProductService } from '../../core/services/product.service'
import { Product } from '../../shared/interfaces/product'
import { CartService } from '../../core/services/cart.service'
import { ProductFiltersComponent } from './product-filters.component'
import { ProductGridComponent } from './product-grid.component'
import { ProductHeroComponent } from './product-hero.component'
import { TranslatePipe } from '../../core/i18n/translate.pipe'
import { TranslationService } from '../../core/i18n/translation.service'

type StoreProduct = Product & {
  viewPrice: number
  viewTag: string
  viewTagSeverity: 'success' | 'warning'
  viewTone: string
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CarouselModule, TagModule, ButtonModule, ProductHeroComponent, ProductFiltersComponent, ProductGridComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <section class="products-page">
    <section
      class="market-hero"
      [class.market-hero--rtl]="currentLang === 'ar'"
      [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'"
    >
      <div class="market-hero-grid">
        <div class="market-brand-lockup">
          <span class="market-brand-seven">7</span>
          <div>
            <strong>7 Stars Mall</strong>
            <small>{{ 'store.sportStore' | t }}</small>
          </div>
        </div>

        <div class="market-hero-message">
          <p class="eyebrow">{{ 'store.collection' | t }}</p>
          <h1>{{ 'store.heroTitle' | t }}</h1>
          <p>{{ 'store.heroSubtitle' | t }}</p>
        </div>

      </div>
    </section>

    <section *ngIf="products.length > 0" class="brand-showcase">
      <button type="button" *ngFor="let brand of brandTiles; trackBy: trackBrand" (click)="openDepartment(brand)">
        <span><i [class]="brand.icon" aria-hidden="true"></i></span>
        <strong>{{ brand.labelKey | t }}</strong>
      </button>
    </section>

    <section *ngIf="products.length > 0" class="featured-carousel-card market-featured-card">
      <div class="featured-carousel-heading">
        <div>
          <p class="eyebrow">{{ 'store.featuredPicks' | t }}</p>
          <h2>{{ 'store.freshFrom' | t }}</h2>
        </div>
        <span>{{ products.length }} {{ 'store.products' | t }}</span>
      </div>

      <p-carousel
        [value]="products"
        [numVisible]="3"
        [numScroll]="3"
        [circular]="false"
        [responsiveOptions]="responsiveOptions"
      >
        <ng-template let-product pTemplate="item">
          <article class="featured-product-card">
            <div class="featured-product-media" [ngClass]="product.viewTone">
              <img [src]="product.url" [alt]="product.name" />
              <p-tag
                [value]="product.viewTag"
                [severity]="product.viewTagSeverity"
                class="featured-product-tag"
              />
            </div>

            <a class="featured-product-name" [routerLink]="['/products', product.id]">{{ product.name }}</a>

            <div class="featured-product-bottom">
              <strong>{{ product.viewPrice | currency }}</strong>
              <span>
                <p-button icon="pi pi-heart" severity="secondary" [outlined]="true" styleClass="featured-icon-button" />
                <p-button icon="pi pi-shopping-cart" styleClass="featured-icon-button featured-cart-button" (onClick)="add(product)" />
              </span>
            </div>
          </article>
        </ng-template>
      </p-carousel>
    </section>

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

    <div class="market-section-heading" *ngIf="products.length > 0">
      <div>
        <p class="eyebrow">{{ 'store.catalog' | t }}</p>
        <h2>{{ 'store.shopCollection' | t }}</h2>
      </div>
      <span>{{ products.length }} {{ 'store.visible' | t }}</span>
    </div>

    <div *ngIf="loading && products.length === 0" class="state-card">{{ 'store.loadingProducts' | t }}</div>
    <div *ngIf="error" class="state-card error">{{ error }}</div>
    <div *ngIf="!loading && !error && products.length === 0" class="state-card">{{ 'store.noMatches' | t }}</div>

    <app-product-grid
      *ngIf="!error && products.length > 0"
      [products]="products"
      [cartQuantities]="cartQuantities"
      [addedProductId]="addedProductId"
      (addToCart)="add($event)"
    ></app-product-grid>

    <div *ngIf="loadingMore" class="state-card loading-more">{{ 'store.loadingMore' | t }}</div>
  </section>
  `
})
export class ProductListComponent implements OnInit {
  products: StoreProduct[] = []
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
  responsiveOptions = [
    {
      breakpoint: '1200px',
      numVisible: 3,
      numScroll: 3
    },
    {
      breakpoint: '900px',
      numVisible: 2,
      numScroll: 2
    },
    {
      breakpoint: '560px',
      numVisible: 1,
      numScroll: 1
    }
  ]
  brandTiles = [
    { name: 'Fresh Market', labelKey: 'store.departmentFreshMarket', icon: 'pi pi-shopping-bag', category: 'produce' },
    { name: 'Bakery', labelKey: 'store.departmentBakery', icon: 'pi pi-box', category: 'bakery' },
    { name: 'Dairy', labelKey: 'store.departmentDairy', icon: 'pi pi-star', category: 'dairy' },
    { name: 'Pantry', labelKey: 'store.departmentPantry', icon: 'pi pi-tags', category: 'pantry' },
    { name: 'Drinks', labelKey: 'store.departmentDrinks', icon: 'pi pi-shopping-cart', category: 'drinks' },
    { name: 'Household', labelKey: 'store.departmentHousehold', icon: 'pi pi-home', category: 'household' },
    { name: 'Personal Care', labelKey: 'store.departmentPersonalCare', icon: 'pi pi-heart', category: 'personal' },
    { name: 'Weekly Deals', labelKey: 'store.departmentWeeklyDeals', icon: 'pi pi-percentage', category: 'all' }
  ]

  constructor(
    private productService: ProductService,
    private cart: CartService,
    private translations: TranslationService,
    private cdr: ChangeDetectorRef
  ) {}

  get currentLang(): string {
    return this.translations.currentLanguage
  }

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
    if (this.selectedCategory === category) {
      return
    }

    this.selectedCategory = category
    window.clearTimeout(this.filterTimer)
    this.loadProducts(true)
  }

  updateSearchTerm(searchTerm: string) {
    if (this.searchTerm === searchTerm) {
      return
    }

    this.searchTerm = searchTerm
    this.onFilterChange()
  }

  openDepartment(tile: { category?: string }) {
    const requestedCategory = tile.category || 'all'
    const matchingCategory = this.categories.find(category => category.toLowerCase() === requestedCategory.toLowerCase())
    const nextCategory = matchingCategory || 'all'

    if (!this.searchTerm && this.selectedCategory === nextCategory && this.priceLimit === this.maxProductPrice) {
      return
    }

    this.searchTerm = ''
    this.selectedCategory = nextCategory
    this.priceLimit = this.maxProductPrice
    window.clearTimeout(this.filterTimer)
    this.loadProducts(true)
  }

  updatePriceLimit(priceLimit: number) {
    const nextPriceLimit = Number(priceLimit)

    if (this.priceLimit === nextPriceLimit) {
      return
    }

    this.priceLimit = nextPriceLimit
    this.onFilterChange()
  }

  onFilterChange() {
    window.clearTimeout(this.filterTimer)
    this.filterTimer = window.setTimeout(() => this.loadProducts(true), this.filterDelayMs)
  }

  clearFilters() {
    if (!this.searchTerm && this.selectedCategory === 'all' && this.priceLimit === this.maxProductPrice) {
      return
    }

    this.searchTerm = ''
    this.selectedCategory = 'all'
    this.priceLimit = this.maxProductPrice
    window.clearTimeout(this.filterTimer)
    this.loadProducts(true)
  }

  trackCategory(index: number, category: string): string {
    return category
  }

  trackBrand(index: number, brand: { name: string }): string {
    return brand.name
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
        const mappedProducts = products.map(product => this.toStoreProduct(product))
        this.products = reset ? mappedProducts : [...this.products, ...mappedProducts]
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

  private toStoreProduct(product: Product): StoreProduct {
    return {
      ...product,
      viewPrice: Number(product.finalPrice ?? product.price),
      viewTag: product.promotion?.is_active ? 'Deal' : 'In stock',
      viewTagSeverity: product.promotion?.is_active ? 'warning' : 'success',
      viewTone: this.categoryTone(product)
    }
  }

  private categoryTone(product: Product): string {
    const category = (product.category || 'default').toLowerCase()

    return ['running', 'lifestyle', 'trail', 'training', 'casual', 'boots', 'fresh', 'produce', 'bakery', 'dairy', 'pantry', 'drinks', 'household', 'cleaning', 'personal', 'frozen'].includes(category)
      ? `tone-${category}`
      : 'tone-default'
  }
}
