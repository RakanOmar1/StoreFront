import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters-card">
      <label>
        Search
        <input
          type="search"
          [ngModel]="searchTerm"
          (ngModelChange)="searchTermChange.emit($event)"
          placeholder="Search shoes..."
        />
      </label>

      <label>
        Max price: {{ priceLimit | currency }}
        <input
          type="range"
          min="0"
          [max]="maxProductPrice"
          step="5"
          [ngModel]="priceLimit"
          (ngModelChange)="priceLimitChange.emit($event)"
        />
      </label>

      <div class="category-tabs" aria-label="Product categories">
        <button type="button" [class.active]="selectedCategory === 'all'" (click)="categorySelected.emit('all')">All</button>
        <button
          type="button"
          *ngFor="let category of categories; trackBy: trackCategory"
          [class.active]="selectedCategory === category"
          (click)="categorySelected.emit(category)"
        >
          {{ category }}
        </button>
      </div>

      <button type="button" (click)="cleared.emit()">Clear filters</button>
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
}
