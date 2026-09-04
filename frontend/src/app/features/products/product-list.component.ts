import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { ButtonModule } from 'primeng/button'
import { Carousel, CarouselModule } from 'primeng/carousel'
import { TagModule } from 'primeng/tag'
import { Subject, takeUntil } from 'rxjs'
import { ProductService, ProductSort } from '../../core/services/product.service'
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

    <section
      *ngIf="products.length > 0"
      class="brand-showcase"
      [class.brand-showcase--rtl]="currentLang === 'ar'"
      [class.brand-showcase--ltr]="currentLang !== 'ar'"
      dir="ltr"
    >
      <div class="department-marquee-track">
        <div class="department-marquee-group">
          <button type="button" *ngFor="let categoryTile of departmentMarqueeTiles" (click)="openDepartment(categoryTile)">
            <span><i [class]="categoryTile.icon" aria-hidden="true"></i></span>
            <strong>{{ categoryTile.labelKey | t }}</strong>
          </button>
        </div>
        <div class="department-marquee-group" aria-hidden="true">
          <button type="button" tabindex="-1" *ngFor="let categoryTile of departmentMarqueeTiles" (click)="openDepartment(categoryTile)">
            <span><i [class]="categoryTile.icon" aria-hidden="true"></i></span>
            <strong>{{ categoryTile.labelKey | t }}</strong>
          </button>
        </div>
      </div>
    </section>

    <section
      *ngIf="products.length > 0"
      class="featured-carousel-card market-featured-card"
      [class.featured-carousel-card--static]="!shouldRunFeaturedCarousel"
      dir="ltr"
      (mouseenter)="pauseFeaturedCarousel()"
      (mouseleave)="resumeFeaturedCarousel()"
    >
      <div class="featured-carousel-heading" [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
        <div>
          <p class="eyebrow">{{ 'store.featuredPicks' | t }}</p>
          <h2>{{ 'store.freshFrom' | t }}</h2>
        </div>
        <span>{{ products.length }} {{ 'store.products' | t }}</span>
      </div>

      <p-carousel
        #featuredCarousel
        [value]="products"
        [numVisible]="4"
        [numScroll]="1"
        [circular]="shouldRunFeaturedCarousel"
        [showNavigators]="shouldRunFeaturedCarousel"
        [showIndicators]="shouldRunFeaturedCarousel && !isPhoneViewport"
        [autoplayInterval]="shouldRunFeaturedCarousel ? featuredAutoplayDelay : 0"
        [responsiveOptions]="responsiveOptions"
        styleClass="featured-carousel"
        (onPage)="onFeaturedPage($event)"
      >
        <ng-template let-product pTemplate="item">
          <article class="featured-product-card" [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
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
                <p-button icon="pi pi-heart" severity="secondary" [outlined]="true" styleClass="featured-icon-button" (onClick)="stopFeaturedAction($event)" />
                <p-button icon="pi pi-shopping-cart" styleClass="featured-icon-button featured-cart-button" (onClick)="addFeatured(product, $event)" />
              </span>
            </div>
          </article>
        </ng-template>
      </p-carousel>

      <div
        *ngIf="shouldRunFeaturedCarousel && isPhoneViewport"
        class="mobile-featured-indicators"
        role="presentation"
        aria-hidden="true"
      >
        <span
          *ngFor="let indicator of visibleFeaturedIndicators; trackBy: trackFeaturedIndicator"
          class="mobile-featured-indicator"
          [class.active]="indicator.active"
        ></span>
      </div>
    </section>

    <div class="catalog-layout" [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <aside class="catalog-filters catalog-filters--desktop" *ngIf="filtersLoaded">
        <app-product-filters
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
      </aside>

      <section class="catalog-results">
        <div class="mobile-filter-toolbar" *ngIf="filtersLoaded">
          <button type="button" class="mobile-filter-trigger" (click)="openMobileFilters()" [attr.aria-expanded]="mobileFiltersOpen">
            <i class="pi pi-filter" aria-hidden="true"></i>
            <span>{{ 'store.filters' | t }}</span>
            <b *ngIf="activeFilterCount > 0">{{ activeFilterCount }}</b>
          </button>
          <span class="mobile-visible-count">{{ products.length }} {{ 'store.products' | t }}</span>
        </div>

        <div class="market-section-heading" *ngIf="products.length > 0">
          <div>
            <p class="eyebrow">{{ 'store.catalog' | t }}</p>
            <h2>{{ 'store.shopCollection' | t }}</h2>
          </div>
          <label class="catalog-sort">
            <span>{{ 'store.sortBy' | t }}</span>
            <select [(ngModel)]="sortBy" (ngModelChange)="changeSort($event)" [attr.aria-label]="'store.sortBy' | t">
              <option value="featured">{{ 'store.sortFeatured' | t }}</option>
              <option value="price-asc">{{ 'store.sortPriceLow' | t }}</option>
              <option value="price-desc">{{ 'store.sortPriceHigh' | t }}</option>
              <option value="name">{{ 'store.sortName' | t }}</option>
            </select>
          </label>
        </div>

        <div *ngIf="loading && products.length === 0" class="state-card">{{ 'store.loadingProducts' | t }}</div>
        <div *ngIf="error" class="state-card error">
          <span>{{ error }}</span>
          <button type="button" (click)="retryProducts()">{{ 'common.retry' | t }}</button>
        </div>
        <div *ngIf="!loading && !error && products.length === 0" class="state-card">{{ 'store.noMatches' | t }}</div>

        <app-product-grid
          *ngIf="!error && products.length > 0"
          [products]="sortedProducts"
          [cartQuantities]="cartQuantities"
          [addedProductId]="addedProductId"
          (addToCart)="add($event)"
        ></app-product-grid>

        <div *ngIf="loadingMore" class="state-card loading-more">{{ 'store.loadingMore' | t }}</div>
      </section>
    </div>

    <div class="mobile-filter-shell" [class.open]="mobileFiltersOpen" [attr.aria-hidden]="!mobileFiltersOpen" *ngIf="filtersLoaded">
      <button type="button" class="mobile-filter-backdrop" (click)="closeMobileFilters()" [attr.aria-label]="'store.closeFilters' | t"></button>
      <aside class="mobile-filter-drawer" role="dialog" aria-modal="true" [attr.inert]="mobileFiltersOpen ? null : ''" [attr.aria-label]="'store.filters' | t" [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
        <header class="mobile-filter-drawer-header">
          <div>
            <span>{{ 'store.filters' | t }}</span>
            <small *ngIf="activeFilterCount > 0">{{ activeFilterCount }} {{ 'store.activeFilters' | t }}</small>
          </div>
          <button type="button" class="mobile-filter-close" (click)="closeMobileFilters()" [attr.aria-label]="'store.closeFilters' | t">
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </header>
        <div class="mobile-filter-drawer-body">
          <app-product-filters
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
        </div>
        <footer class="mobile-filter-drawer-footer">
          <button type="button" class="mobile-filter-apply" (click)="applyMobileFilters()">
            {{ 'store.showResults' | t }} ({{ products.length }})
          </button>
        </footer>
      </aside>
    </div>

    <a *ngIf="cartItemCount > 0" class="mobile-cart-summary" routerLink="/cart">
      <span>
        <strong>{{ cartItemCount }} {{ 'common.items' | t }}</strong>
        <small>{{ 'cart.shoppingBag' | t }}</small>
      </span>
      <b>{{ cartSubtotal | currency }}</b>
    </a>
  </section>
  `
})
export class ProductListComponent implements OnInit, OnDestroy {
  @ViewChild('featuredCarousel') featuredCarousel?: Carousel
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
  cartItemCount = 0
  cartSubtotal = 0
  private readonly pageSize = 50
  private readonly filterDelayMs = 600
  readonly featuredAutoplayDelay = 2000
  private readonly destroy$ = new Subject<void>()
  private filterTimer?: number
  private featuredAutoplayRestartTimer?: number
  private pendingReset = false
  private currentFeaturedVisible = 4
  private isFeaturedCarouselHovered = false
  isPhoneViewport = false
  featuredPageIndex = 0
  mobileFiltersOpen = false
  sortBy: ProductSort = 'featured'
  private previousBodyOverflow = ''
  responsiveOptions = [
    {
      breakpoint: '1023px',
      numVisible: 2,
      numScroll: 1
    },
    {
      breakpoint: '639px',
      numVisible: 1,
      numScroll: 1
    }
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

  get departmentTiles(): Array<{ name: string; labelKey: string; icon: string; category: string }> {
    return [
      { name: 'all', labelKey: 'common.all', icon: 'pi pi-th-large', category: 'all' },
      ...this.categories.map(category => ({
        name: category,
        labelKey: this.categoryTranslationKey(category),
        icon: this.categoryIcon(category),
        category
      }))
    ]
  }

  get departmentMarqueeTiles(): Array<{ name: string; labelKey: string; icon: string; category: string }> {
    const tiles = this.departmentTiles
    // A single category set can be narrower than a wide desktop viewport.
    // Repeating it inside each half keeps the infinite track filled at all times.
    return [...tiles, ...tiles]
  }

  get shouldRunFeaturedCarousel(): boolean {
    return this.products.length > this.currentFeaturedVisible
  }

  get activeFilterCount(): number {
    return Number(Boolean(this.searchTerm.trim()))
      + Number(this.selectedCategory !== 'all')
      + Number(this.maxProductPrice > 0 && this.priceLimit < this.maxProductPrice)
  }

  get sortedProducts(): StoreProduct[] {
    return this.products
  }

  get visibleFeaturedIndicators(): Array<{ index: number; active: boolean }> {
    const total = this.products.length
    if (!total) {
      return []
    }

    const limit = Math.min(total, window.innerWidth <= 359 ? 5 : 7)
    const activeIndex = ((this.featuredPageIndex % total) + total) % total
    const start = activeIndex - Math.floor(limit / 2)

    return Array.from({ length: limit }, (_, offset) => {
      const index = ((start + offset) % total + total) % total
      return { index, active: index === activeIndex }
    })
  }

  ngOnInit() {
    this.updateFeaturedVisible()

    this.cart.cart$.pipe(takeUntil(this.destroy$)).subscribe(items => {
      this.cartQuantities = items.reduce<Record<number, number>>((quantities, item) => {
        if (item.product.id) {
          quantities[item.product.id] = item.quantity
        }

        return quantities
      }, {})
      this.cartItemCount = items.reduce((total, item) => total + item.quantity, 0)
      this.cartSubtotal = items.reduce((total, item) => total + this.unitPrice(item.product) * item.quantity, 0)
      this.cdr.markForCheck()
    })

    this.loading = true
    this.productService.getProductFilters().pipe(takeUntil(this.destroy$)).subscribe({
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

  ngOnDestroy() {
    window.clearTimeout(this.filterTimer)
    window.clearTimeout(this.featuredAutoplayRestartTimer)
    this.featuredCarousel?.stopAutoplay(false)
    this.unlockPageScroll()
    this.destroy$.next()
    this.destroy$.complete()
  }

  @HostListener('window:scroll')
  onScroll() {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500

    if (nearBottom) {
      this.loadProducts(false)
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.updateFeaturedVisible()

    if (window.innerWidth >= 768 && this.mobileFiltersOpen) {
      this.closeMobileFilters()
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeMobileFilters()
  }

  openMobileFilters() {
    if (window.innerWidth >= 768 || this.mobileFiltersOpen) return

    this.mobileFiltersOpen = true
    this.previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    this.cdr.markForCheck()
    window.setTimeout(() => document.querySelector<HTMLElement>('.mobile-filter-close')?.focus(), 0)
  }

  closeMobileFilters() {
    if (!this.mobileFiltersOpen) return

    this.mobileFiltersOpen = false
    this.unlockPageScroll()
    this.cdr.markForCheck()
    window.setTimeout(() => document.querySelector<HTMLElement>('.mobile-filter-trigger')?.focus(), 0)
  }

  applyMobileFilters() {
    this.closeMobileFilters()
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

  changeSort(sort: ProductSort) {
    this.sortBy = sort
    window.clearTimeout(this.filterTimer)
    this.loadProducts(true)
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

  private categoryTranslationKey(category: string): string {
    const keys: Record<string, string> = {
      'bakery': 'store.departmentBakery',
      'beverages': 'store.departmentDrinks',
      'dairy & eggs': 'store.categoryDairyEggs',
      'fresh produce': 'store.categoryFreshProduce',
      'household': 'store.departmentHousehold',
      'pantry': 'store.departmentPantry',
      'snacks': 'store.categorySnacks'
    }

    return keys[category.toLowerCase()] || category
  }

  private categoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'bakery': 'pi pi-box',
      'beverages': 'pi pi-shopping-cart',
      'dairy & eggs': 'pi pi-star',
      'fresh produce': 'pi pi-shopping-bag',
      'household': 'pi pi-home',
      'pantry': 'pi pi-tags',
      'snacks': 'pi pi-heart'
    }

    return icons[category.toLowerCase()] || 'pi pi-tag'
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
      offset: reset ? 0 : this.products.length,
      sort: this.sortBy
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: products => {
        const mappedProducts = products.map(product => this.toStoreProduct(product))
        this.products = reset ? mappedProducts : [...this.products, ...mappedProducts]
        if (reset) {
          this.featuredPageIndex = 0
        }
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

  addFeatured(product: Product, event?: Event) {
    event?.stopPropagation()
    this.add(product)
    this.scheduleFeaturedAutoplay()
  }

  stopFeaturedAction(event?: Event) {
    event?.stopPropagation()
    this.scheduleFeaturedAutoplay()
  }

  pauseFeaturedCarousel() {
    this.isFeaturedCarouselHovered = true
    window.clearTimeout(this.featuredAutoplayRestartTimer)
    this.featuredCarousel?.stopAutoplay(false)
  }

  resumeFeaturedCarousel() {
    this.isFeaturedCarouselHovered = false
    this.startFeaturedAutoplay()
  }

  scheduleFeaturedAutoplay() {
    window.clearTimeout(this.featuredAutoplayRestartTimer)
    this.featuredAutoplayRestartTimer = window.setTimeout(() => this.startFeaturedAutoplay(), 750)
  }

  retryProducts() {
    this.loadProducts(true)
  }

  onFeaturedPage(event: { page?: number }) {
    if (typeof event.page === 'number') {
      this.featuredPageIndex = event.page
      this.cdr.markForCheck()
    }

    this.scheduleFeaturedAutoplay()
  }

  trackFeaturedIndicator(index: number, indicator: { index: number }): number {
    return indicator.index
  }

  private startFeaturedAutoplay() {
    if (this.isFeaturedCarouselHovered || !this.shouldRunFeaturedCarousel || this.featuredCarousel?.isPlaying()) {
      return
    }

    this.featuredCarousel?.startAutoplay()
  }

  private updateFeaturedVisible() {
    const width = window.innerWidth
    this.isPhoneViewport = width < 640
    this.currentFeaturedVisible = width >= 1024 ? 4 : width >= 640 ? 2 : 1

    if (!this.shouldRunFeaturedCarousel) {
      window.clearTimeout(this.featuredAutoplayRestartTimer)
      this.featuredCarousel?.stopAutoplay(false)
    }

    this.cdr.markForCheck()
  }

  private unlockPageScroll() {
    document.body.style.overflow = this.previousBodyOverflow
    this.previousBodyOverflow = ''
  }

  private unitPrice(product: Product): number {
    return Number(product.finalPrice ?? product.price)
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
