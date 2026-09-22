import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TranslatePipe } from '../../core/i18n/translate.pipe'

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters-card">
      <header class="filter-panel-header">
        <span class="filter-panel-icon"><i class="pi pi-filter" aria-hidden="true"></i></span>
        <span><strong>{{ 'store.filters' | t }}</strong><small>{{ 'store.refineResults' | t }}</small></span>
      </header>

      <label class="filter-section filter-search-section">
        <span class="filter-label">
          <span class="filter-label-copy"><i class="pi pi-search" aria-hidden="true"></i><span>{{ 'common.search' | t }}</span></span>
        </span>
        <span class="filter-search-field">
          <i class="pi pi-search" aria-hidden="true"></i>
          <input
            type="search"
            autocomplete="off"
            [ngModel]="searchTerm"
            (ngModelChange)="searchTermChange.emit($event)"
            [placeholder]="'store.searchPlaceholder' | t"
            [attr.aria-label]="'common.search' | t"
          />
          <button *ngIf="searchTerm" type="button" class="clear-search" [attr.aria-label]="'common.clearFilters' | t" (click)="searchTermChange.emit('')">
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </span>
      </label>

      <label class="filter-section filter-price-section">
        <span class="filter-label filter-label--value">
          <span class="filter-label-copy"><i class="pi pi-sliders-h" aria-hidden="true"></i><span>{{ 'store.maxPrice' | t }}</span></span>
          <b class="price-value">{{ priceLimit | currency }}</b>
        </span>
        <input
          type="range"
          min="0"
          [max]="maxProductPrice"
          step="5"
          [ngModel]="priceLimit"
          (ngModelChange)="priceLimitChange.emit($event)"
          [attr.aria-label]="'store.maxPrice' | t"
          [style.background]="rangeBackground"
        />
        <span class="price-scale"><small>{{ 0 | currency }}</small><small>{{ maxProductPrice | currency }}</small></span>
      </label>

      <div class="filter-category-group filter-section">
        <p class="filter-group-title">
          <span class="filter-label-copy"><i class="pi pi-th-large" aria-hidden="true"></i><span>{{ 'store.productCategories' | t }}</span></span>
          <small>{{ categories.length + 1 }}</small>
        </p>
        <div class="category-tabs" role="group" [attr.aria-label]="'store.productCategories' | t">
          <button type="button" [class.active]="selectedCategory === 'all'" [attr.aria-pressed]="selectedCategory === 'all'" (click)="categorySelected.emit('all')">
            <span class="category-icon"><i class="pi pi-th-large" aria-hidden="true"></i></span>
            <span class="category-name">{{ 'common.all' | t }}</span>
            <i *ngIf="selectedCategory === 'all'" class="pi pi-check category-check" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            *ngFor="let category of categories; trackBy: trackCategory"
            [class.active]="selectedCategory === category"
            [attr.aria-pressed]="selectedCategory === category"
            (click)="categorySelected.emit(category)"
          >
            <span class="category-icon"><i [class]="categoryIcon(category)" aria-hidden="true"></i></span>
            <span class="category-name">{{ categoryTranslationKey(category) | t }}</span>
            <i *ngIf="selectedCategory === category" class="pi pi-check category-check" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <button type="button" class="clear-filters-button" (click)="cleared.emit()">
        <i class="pi pi-filter-slash" aria-hidden="true"></i>
        <span>{{ 'common.clearFilters' | t }}</span>
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .filters-card { min-width: 0; }
    .filters-card label, .filter-category-group { min-width: 0; }
    input[type='search'] { width: 100%; min-width: 0; }
    input[type='range'] { width: 100%; }
    input:focus-visible, button:focus-visible { outline: 3px solid var(--focus-ring, #f59e0b); outline-offset: 2px; }
    .category-tabs { min-width: 0; }
    .category-tabs button { min-height: 42px; white-space: normal; overflow-wrap: anywhere; }
    @media (max-width: 767px) {
      .filters-card { width: 100%; max-width: 100%; }
      .category-tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; overflow: visible; }
      .category-tabs button { width: 100%; }
    }
  `]
})
export class ProductFiltersComponent {
  @Input() categories: string[] = []
  @Input() selectedCategory = 'all'
  @Input() searchTerm = ''
  @Input() priceLimit = 0
  @Input() maxProductPrice = 0
  @Output() searchTermChange = new EventEmitter<string>()
  @Output() priceLimitChange = new EventEmitter<number>()
  @Output() categorySelected = new EventEmitter<string>()
  @Output() cleared = new EventEmitter<void>()

  get rangeBackground(): string {
    const percent = this.maxProductPrice > 0 ? Math.min(100, Math.max(0, (this.priceLimit / this.maxProductPrice) * 100)) : 0
    return `linear-gradient(to right, #0b765d 0%, #0b765d ${percent}%, #dbe7e2 ${percent}%, #dbe7e2 100%)`
  }

  trackCategory(index: number, category: string): string {
    return category
  }

  categoryTranslationKey(category: string): string {
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

  categoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'bakery': 'pi pi-shopping-bag',
      'beverages': 'pi pi-bolt',
      'dairy & eggs': 'pi pi-circle',
      'fresh produce': 'pi pi-sun',
      'frozen foods': 'pi pi-snowflake',
      'household': 'pi pi-home',
      'pantry': 'pi pi-box',
      'personal care': 'pi pi-heart',
      'snacks': 'pi pi-star'
    }

    return icons[category.toLowerCase()] || 'pi pi-tag'
  }
}
