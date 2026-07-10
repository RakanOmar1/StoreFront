import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { map } from 'rxjs'
import { ProductService } from '../../core/services/product.service'
import { CartService } from '../../core/services/cart.service'
import { Product } from '../../shared/interfaces/product'
import { TranslatePipe } from '../../core/i18n/translate.pipe'
import { TranslationService } from '../../core/i18n/translation.service'

type ProductTab = 'description' | 'specifications' | 'reviews' | 'shipping'

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
  template: `
  <section class="product-detail-page">
    <div *ngIf="loading" class="state-card">{{ 'store.loadingProduct' | t }}</div>
    <div *ngIf="error" class="state-card error">{{ error }}</div>

    <ng-container *ngIf="product">
      <nav class="product-breadcrumb" aria-label="Breadcrumb">
        <a routerLink="/products">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3 11 9-8 9 8" />
            <path d="M5 10v10h14V10" />
          </svg>
          {{ 'store.home' | t }}
        </a>
        <span>/</span>
        <button type="button" [routerLink]="['/products']" [queryParams]="{ category: product.category || 'all' }">
          {{ product.category || ('store.supermarket' | t) }}
        </button>
        <span>/</span>
        <strong>{{ brandName }}</strong>
      </nav>

      <article class="premium-product-detail">
        <section class="detail-gallery" [attr.aria-label]="'store.productGallery' | t">
          <div class="main-product-image">
            <span class="image-discount-badge" *ngIf="hasDiscount">-{{ discountLabel }}</span>
            <button class="image-expand-button" type="button" [attr.aria-label]="'store.zoomProductImage' | t">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 3h6v6" />
                <path d="m14 10 7-7" />
                <path d="M9 21H3v-6" />
                <path d="m10 14-7 7" />
              </svg>
            </button>
            <img [src]="selectedImage" [alt]="product.name" loading="eager" />
          </div>

          <div class="gallery-thumbnails" role="list">
            <button
              *ngFor="let image of galleryImages; let i = index"
              type="button"
              role="listitem"
              [class.active]="selectedImage === image"
              (click)="selectedImage = image"
              [attr.aria-label]="('store.showProductImage' | t: { count: i + 1 })"
            >
              <img [src]="image" [alt]="product.name + ' thumbnail ' + (i + 1)" loading="lazy" />
            </button>
          </div>
        </section>

        <section class="detail-main">
          <p class="product-category detail-category">{{ product.category || ('store.supermarket' | t) }}</p>
          <h1>{{ product.name }}</h1>

          <div class="rating-row">
            <span class="stars" aria-label="Rated 4.8 out of 5">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
            <strong>4.8</strong>
            <a href="#reviews">{{ 'store.reviewsCount' | t: { count: 126 } }}</a>
            <button type="button" (click)="activeTab = 'reviews'">{{ 'store.writeReview' | t }}</button>
          </div>

          <div class="price-stack">
            <strong>{{ currentPrice | currency }}</strong>
            <del *ngIf="hasDiscount">{{ product.price | currency }}</del>
            <span *ngIf="hasDiscount">{{ 'store.save' | t }} {{ savings | currency }}</span>
          </div>

          <div class="stock-row">
            <span class="stock-pill"><i></i> {{ 'store.inStock' | t }}</span>
            <strong>{{ 'store.onlyLeft' | t: { count: stockCount } }}</strong>
            <span class="ships-today">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 7h11v10H3z" />
                <path d="M14 10h4l3 3v4h-7z" />
                <circle cx="7" cy="19" r="2" />
                <circle cx="17" cy="19" r="2" />
              </svg>
              {{ 'store.shipsToday' | t }}
            </span>
          </div>

          <p class="detail-description">{{ product.description }}</p>

          <ul class="highlight-list" [attr.aria-label]="'store.productHighlights' | t">
            <li *ngFor="let highlight of highlights">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 12 4 4L19 6" />
              </svg>
              {{ highlight | t }}
            </li>
          </ul>

          <div class="purchase-panel">
            <div>
              <span class="purchase-label">{{ 'store.quantity' | t }}</span>
              <div class="stepper" [attr.aria-label]="'store.quantitySelector' | t">
                <button type="button" (click)="decreaseQuantity()" [attr.aria-label]="'store.decreaseQuantity' | t">-</button>
                <input type="number" [(ngModel)]="quantity" min="1" />
                <button type="button" (click)="increaseQuantity()" [attr.aria-label]="'store.increaseQuantity' | t">+</button>
              </div>
            </div>

            <button class="primary-action" type="button" (click)="add()">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 5h2l1.5 9.5h8.7L20 8H8" />
                <circle cx="10" cy="19" r="1.5" />
                <circle cx="17" cy="19" r="1.5" />
              </svg>
              {{ added ? ('store.addedToCart' | t) : ('store.addToCart' | t) }}
            </button>
          </div>

          <button class="wishlist-action" type="button">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
            </svg>
            {{ 'store.addToWishlist' | t }}
          </button>
        </section>
      </article>

      <section class="trust-grid" [attr.aria-label]="'store.shoppingBenefits' | t">
        <div>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 7h11v10H3z" />
            <path d="M14 10h4l3 3v4h-7z" />
            <circle cx="7" cy="19" r="2" />
            <circle cx="17" cy="19" r="2" />
          </svg>
          <strong>{{ 'store.freeShipping' | t }}</strong>
          <small>{{ 'store.onAllOrders' | t }}</small>
        </div>
        <div>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v6h6" />
          </svg>
          <strong>{{ 'store.returns30' | t }}</strong>
          <small>{{ 'store.easyReturns' | t }}</small>
        </div>
        <div>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
            <path d="m9 12 2 2 4-5" />
          </svg>
          <strong>{{ 'store.authenticProduct' | t }}</strong>
          <small>{{ 'store.verifiedBy' | t }}</small>
        </div>
        <div>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <strong>{{ 'store.securePayment' | t }}</strong>
          <small>{{ 'store.protectedCheckout' | t }}</small>
        </div>
      </section>

      <section class="detail-info-grid">
        <article class="offer-card" *ngIf="product.promotion">
          <span>
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 12 12 20 4 12V4h8z" />
              <circle cx="9" cy="9" r="1.5" />
            </svg>
            {{ 'store.availableOffer' | t }}
          </span>
          <h2>{{ product.promotion.name }}</h2>
          <strong>{{ promotionValue }} {{ 'store.off' | t }}</strong>
          <p>{{ 'store.appliedAutomatically' | t }}</p>
        </article>

        <article class="delivery-card">
          <span>
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 7h11v10H3z" />
              <path d="M14 10h4l3 3v4h-7z" />
              <circle cx="7" cy="19" r="2" />
              <circle cx="17" cy="19" r="2" />
            </svg>
            {{ 'store.delivery' | t }}
          </span>
          <h2>{{ 'store.freeDelivery' | t }}</h2>
          <p>{{ 'store.estimated' | t }}: <strong>{{ 'store.tomorrow' | t }}</strong></p>
          <p>{{ 'store.returnWithin30' | t }}</p>
        </article>

        <article class="spec-card">
          <span>
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 5h6v6H4z" />
              <path d="M14 5h6v6h-6z" />
              <path d="M4 15h6v4H4z" />
              <path d="M14 15h6v4h-6z" />
            </svg>
            {{ 'store.specifications' | t }}
          </span>
          <dl>
            <div><dt>{{ 'common.category' | t }}</dt><dd>{{ product.category || ('store.supermarket' | t) }}</dd></div>
            <div><dt>{{ 'store.brand' | t }}</dt><dd>{{ brandName }}</dd></div>
            <div><dt>SKU</dt><dd>{{ product.sku || sku }}</dd></div>
            <div><dt>{{ 'store.color' | t }}</dt><dd>{{ colorName }}</dd></div>
            <div><dt>{{ 'store.weight' | t }}</dt><dd>{{ weight }}</dd></div>
            <div><dt>{{ 'common.status' | t }}</dt><dd>{{ 'common.active' | t }}</dd></div>
          </dl>
        </article>
      </section>

      <section class="product-tabs" id="reviews">
        <div class="tab-buttons" role="tablist" [attr.aria-label]="'store.productDetails' | t">
          <button type="button" [class.active]="activeTab === 'description'" (click)="activeTab = 'description'">{{ 'store.description' | t }}</button>
          <button type="button" [class.active]="activeTab === 'specifications'" (click)="activeTab = 'specifications'">{{ 'store.specifications' | t }}</button>
          <button type="button" [class.active]="activeTab === 'reviews'" (click)="activeTab = 'reviews'">{{ 'store.reviewsWithCount' | t: { count: 126 } }}</button>
          <button type="button" [class.active]="activeTab === 'shipping'" (click)="activeTab = 'shipping'">{{ 'store.shippingReturns' | t }}</button>
        </div>

        <div class="tab-panel" *ngIf="activeTab === 'description'">{{ product.description }}</div>
        <div class="tab-panel" *ngIf="activeTab === 'specifications'">
          {{ 'store.specificationText' | t: { category: product.category || ('store.dailyWear' | t) } }}
        </div>
        <div class="tab-panel" *ngIf="activeTab === 'reviews'">
          {{ 'store.reviewText' | t }}
        </div>
        <div class="tab-panel" *ngIf="activeTab === 'shipping'">
          {{ 'store.shippingText' | t }}
        </div>
      </section>

      <section class="related-products" *ngIf="relatedProducts.length > 0">
        <div class="section-heading-row">
          <h2>{{ 'store.youMayAlsoLike' | t }}</h2>
          <a routerLink="/products">{{ 'store.viewAll' | t }}</a>
        </div>
        <div class="related-product-row">
          <a *ngFor="let related of relatedProducts" [routerLink]="['/products', related.id]" class="related-card">
            <img [src]="related.url" [alt]="related.name" loading="lazy" />
            <span class="related-wishlist-icon" aria-hidden="true">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
              </svg>
            </span>
            <strong>{{ related.name }}</strong>
            <span>{{ priceFor(related) | currency }}</span>
          </a>
        </div>
      </section>

      <a class="floating-cart-button" routerLink="/cart" [attr.aria-label]="'store.openCart' | t">
        <span *ngIf="(cartCount$ | async) as cartCount">{{ cartCount }}</span>
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 5h2l1.5 9.5h8.7L20 8H8" />
          <circle cx="10" cy="19" r="1.5" />
          <circle cx="17" cy="19" r="1.5" />
        </svg>
      </a>
    </ng-container>
  </section>
  `
})
export class ProductDetailsComponent {
  product: Product | null = null
  relatedProducts: Product[] = []
  selectedImage = ''
  activeTab: ProductTab = 'description'
  loading = false
  error: string | null = null
  quantity = 1
  added = false
  cartCount$ = this.cart.cart$.pipe(
    map(items => items.reduce((total, item) => total + item.quantity, 0))
  )

  get galleryImages(): string[] {
    if (!this.product) {
      return []
    }

    return (this.product.images?.length ? this.product.images : [this.product.url]).slice(0, 5)
  }

  get hasDiscount(): boolean {
    return !!this.product?.promotion?.is_active && this.savings >= 0.01
  }

  get currentPrice(): number {
    if (!this.product) {
      return 0
    }

    return this.priceFor(this.product)
  }

  get savings(): number {
    if (!this.product) {
      return 0
    }

    return Math.max(0, Number(this.product.price) - this.currentPrice)
  }

  get discountLabel(): string {
    const promo = this.product?.promotion

    if (!promo) {
      return ''
    }

    return promo.type === 'PERCENT' ? `${promo.value}%` : this.money(this.savings)
  }

  private money(value: number): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value || 0))
  }

  get promotionValue(): string {
    return this.discountLabel || 'Special'
  }

  priceFor(product: Product): number {
    return Number(product.finalPrice ?? product.price)
  }

  get brandName(): string {
    const name = this.product?.name || ''
    return ['Farm Select', 'Daily Pantry', 'Fresh Valley', 'Pure Dairy', 'Bakery House', 'Clean Home']
      .find(brand => name.toLowerCase().includes(brand.toLowerCase())) || '7 Stars Fresh'
  }

  get sku(): string {
    return `${this.brandName.slice(0, 2).toUpperCase()}-${this.product?.id || '000'}`
  }

  get colorName(): string {
    const category = (this.product?.category || '').toLowerCase()

    if (['bakery', 'pantry', 'household'].includes(category)) {
      return this.i18n.translate('store.colorWarm')
    }

    if (['fresh', 'produce', 'dairy'].includes(category)) {
      return this.i18n.translate('store.colorGreen')
    }

    return this.i18n.translate('store.colorMulti')
  }

  get weight(): string {
    return `${300 + ((this.product?.id || 0) % 6) * 20}g`
  }

  get stockCount(): number {
    return 6 + ((this.product?.id || 1) % 8)
  }

  get highlights(): string[] {
    const category = (this.product?.category || '').toLowerCase()
    const base = ['store.highlightDailyEssential', 'store.highlightQualityChecked', 'store.highlightPackedFresh', 'store.highlightFastDelivery']

    if (['fresh', 'produce', 'dairy', 'bakery'].includes(category)) {
      return ['store.highlightFreshlyPicked', 'store.highlightChilledHandling', ...base]
    }

    if (['household', 'cleaning', 'personal'].includes(category)) {
      return ['store.highlightFamilySize', 'store.highlightTrustedBrand', ...base]
    }

    return ['store.highlightGreatValue', 'store.highlightPantryReady', ...base]
  }

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cart: CartService,
    private i18n: TranslationService
  ) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id')

      if (id) {
        this.loadProduct(id)
      }
    })
  }

  increaseQuantity() {
    this.quantity += 1
  }

  decreaseQuantity() {
    this.quantity = Math.max(1, this.quantity - 1)
  }

  add() {
    if (!this.product) {
      return
    }

    this.quantity = Math.max(1, Number(this.quantity) || 1)
    this.cart.addToCart(this.product, this.quantity)
    this.added = true
    window.setTimeout(() => this.added = false, 1200)
  }

  private loadRelated(product: Product) {
    this.productService.getProducts({ category: product.category || undefined, limit: 5 }).subscribe({
      next: products => {
        this.relatedProducts = products.filter(item => item.id !== product.id).slice(0, 4)
      },
      error: () => {
        this.relatedProducts = []
      }
    })
  }

  private loadProduct(id: string) {
    this.loading = true
    this.error = null
    this.product = null
    this.relatedProducts = []
    this.selectedImage = ''
    this.activeTab = 'description'
    this.quantity = 1
    this.added = false

    this.productService.getProduct(id).subscribe({
      next: product => {
        this.product = product
        this.selectedImage = product.url
        this.loading = false
        window.scrollTo({ top: 0, behavior: 'smooth' })
        this.loadRelated(product)
      },
      error: () => {
        this.error = this.i18n.translate('store.loadProductError')
        this.loading = false
      }
    })
  }
}
