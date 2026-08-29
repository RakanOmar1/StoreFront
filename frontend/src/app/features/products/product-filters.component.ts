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
        <span class="filter-label"><i class="pi pi-search" aria-hidden="true"></i>{{ 'common.search' | t }}</span>
        <input
          type="search"
          [ngModel]="searchTerm"
          (ngModelChange)="searchTermChange.emit($event)"
          [placeholder]="'store.searchPlaceholder' | t"
        />
      </label>

      <label>
        <span class="filter-label"><i class="pi pi-sliders-h" aria-hidden="true"></i>{{ 'store.maxPrice' | t }} <b>{{ priceLimit | currency }}</b></span>
        <input
          type="range"
          min="0"
          [max]="maxProductPrice"
          step="5"
          [ngModel]="priceLimit"
          (ngModelChange)="priceLimitChange.emit($event)"
        />
      </label>

      <div class="filter-category-group">
        <p class="filter-group-title"><i class="pi pi-th-large" aria-hidden="true"></i>{{ 'store.productCategories' | t }}</p>
        <div class="category-tabs" [attr.aria-label]="'store.productCategories' | t">
          <button type="button" [class.active]="selectedCategory === 'all'" (click)="categorySelected.emit('all')">{{ 'common.all' | t }}</button>
          <button
            type="button"
            *ngFor="let category of categories; trackBy: trackCategory"
            [class.active]="selectedCategory === category"
            (click)="categorySelected.emit(category)"
          >
            {{ categoryTranslationKey(category) | t }}
          </button>
        </div>
      </div>

      <button type="button" (click)="cleared.emit()">{{ 'common.clearFilters' | t }}</button>
    </div>
  `
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
