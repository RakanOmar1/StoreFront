import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { ButtonModule } from 'primeng/button'
import { Carousel, CarouselModule } from 'primeng/carousel'
import { TagModule } from 'primeng/tag'
import { Subject, takeUntil } from 'rxjs'
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

    <section
      #departmentStrip
      *ngIf="products.length > 0"
      class="brand-showcase"
      (mouseenter)="departmentStripPaused = true"
      (mouseleave)="departmentStripPaused = false"
      (touchstart)="departmentStripPaused = true"
      (touchend)="departmentStripPaused = false"
    >
      <button type="button" *ngFor="let brand of brandTiles; trackBy: trackBrand" (click)="openDepartment(brand)">
        <span><i [class]="brand.icon" aria-hidden="true"></i></span>
        <strong>{{ brand.labelKey | t }}</strong>
      </button>
    </section>

    <section
      *ngIf="products.length > 0"
      class="featured-carousel-card market-featured-card"
      [class.featured-carousel-card--static]="!shouldRunFeaturedCarousel"
      [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'"
      (mouseenter)="pauseFeaturedCarousel()"
      (mouseleave)="resumeFeaturedCarousel()"
    >
      <div class="featured-carousel-heading">
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
        [showIndicators]="shouldRunFeaturedCarousel"
        [autoplayInterval]="shouldRunFeaturedCarousel ? featuredAutoplayDelay : 0"
        [responsiveOptions]="responsiveOptions"
        [styleClass]="currentLang === 'ar' ? 'featured-carousel featured-carousel--rtl' : 'featured-carousel'"
        (onPage)="scheduleFeaturedAutoplay()"
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
                <p-button icon="pi pi-heart" severity="secondary" [outlined]="true" styleClass="featured-icon-button" (onClick)="stopFeaturedAction($event)" />
                <p-button icon="pi pi-shopping-cart" styleClass="featured-icon-button featured-cart-button" (onClick)="addFeatured(product, $event)" />
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
  @ViewChild('departmentStrip')
  set departmentStrip(element: ElementRef<HTMLElement> | undefined) {
    this.departmentStripElement = element
    this.startDepartmentStrip()
  }

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
  departmentStripPaused = false
  private readonly pageSize = 50
  private readonly filterDelayMs = 600
  private departmentStripElement?: ElementRef<HTMLElement>
  private departmentStripTimer?: number
  private departmentScrollDirection = 1
  private lastDepartmentScrollPosition?: number
  readonly featuredAutoplayDelay = 2000
  private readonly destroy$ = new Subject<void>()
  private filterTimer?: number
  private featuredAutoplayRestartTimer?: number
  private pendingReset = false
  private currentFeaturedVisible = 4
  private isFeaturedCarouselHovered = false
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

  get shouldRunFeaturedCarousel(): boolean {
    return this.products.length > this.currentFeaturedVisible
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
    window.clearInterval(this.departmentStripTimer)
    this.featuredCarousel?.stopAutoplay(false)
    this.destroy$.next()
    this.destroy$.complete()
  }

  private startDepartmentStrip(): void {
    window.clearInterval(this.departmentStripTimer)

    const strip = this.departmentStripElement?.nativeElement
    if (!strip) {
      return
    }

    this.departmentScrollDirection = this.currentLang === 'ar' ? -1 : 1
    this.lastDepartmentScrollPosition = undefined
    this.departmentStripTimer = window.setInterval(() => {
      if (this.departmentStripPaused || strip.scrollWidth <= strip.clientWidth) {
        return
      }

      const currentPosition = strip.scrollLeft
      if (
        this.lastDepartmentScrollPosition !== undefined &&
        Math.abs(currentPosition - this.lastDepartmentScrollPosition) < 2
      ) {
        this.departmentScrollDirection *= -1
      }

      this.lastDepartmentScrollPosition = currentPosition
      const tile = strip.querySelector<HTMLElement>('button')
      const distance = (tile?.offsetWidth || 132) + 10
      strip.scrollBy({ left: distance * this.departmentScrollDirection, behavior: 'smooth' })
    }, 1000)
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
    }).pipe(takeUntil(this.destroy$)).subscribe({
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

  private startFeaturedAutoplay() {
    if (this.isFeaturedCarouselHovered || !this.shouldRunFeaturedCarousel || this.featuredCarousel?.isPlaying()) {
      return
    }

    this.featuredCarousel?.startAutoplay()
  }

  private updateFeaturedVisible() {
    const width = window.innerWidth
    this.currentFeaturedVisible = width >= 1024 ? 4 : width >= 640 ? 2 : 1

    if (!this.shouldRunFeaturedCarousel) {
      window.clearTimeout(this.featuredAutoplayRestartTimer)
      this.featuredCarousel?.stopAutoplay(false)
    }

    this.cdr.markForCheck()
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
