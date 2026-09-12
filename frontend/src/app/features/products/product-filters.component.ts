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
      <label>
        <span class="filter-label">
          <span class="filter-label-copy"><i class="pi pi-search" aria-hidden="true"></i><span>{{ 'common.search' | t }}</span></span>
        </span>
        <input
          type="search"
          autocomplete="off"
          [ngModel]="searchTerm"
          (ngModelChange)="searchTermChange.emit($event)"
          [placeholder]="'store.searchPlaceholder' | t"
          [attr.aria-label]="'common.search' | t"
        />
      </label>

      <label>
        <span class="filter-label filter-label--value">
          <span class="filter-label-copy"><i class="pi pi-sliders-h" aria-hidden="true"></i><span>{{ 'store.maxPrice' | t }}</span></span>
          <b>{{ priceLimit | currency }}</b>
        </span>
        <input
          type="range"
          min="0"
          [max]="maxProductPrice"
          step="5"
          [ngModel]="priceLimit"
          (ngModelChange)="priceLimitChange.emit($event)"
          [attr.aria-label]="'store.maxPrice' | t"
        />
      </label>

      <div class="filter-category-group">
        <p class="filter-group-title"><span class="filter-label-copy"><i class="pi pi-th-large" aria-hidden="true"></i><span>{{ 'store.productCategories' | t }}</span></span></p>
        <div class="category-tabs" role="group" [attr.aria-label]="'store.productCategories' | t">
          <button type="button" [class.active]="selectedCategory === 'all'" [attr.aria-pressed]="selectedCategory === 'all'" (click)="categorySelected.emit('all')">{{ 'common.all' | t }}</button>
          <button
            type="button"
            *ngFor="let category of categories; trackBy: trackCategory"
            [class.active]="selectedCategory === category"
            [attr.aria-pressed]="selectedCategory === category"
            (click)="categorySelected.emit(category)"
          >
            {{ categoryTranslationKey(category) | t }}
          </button>
        </div>
      </div>

      <button type="button" (click)="cleared.emit()">{{ 'common.clearFilters' | t }}</button>
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
}
