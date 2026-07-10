import { CommonModule } from '@angular/common'
import { Component, HostListener, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { Observable } from 'rxjs'
import { finalize, timeout } from 'rxjs/operators'
import { DropdownModule } from 'primeng/dropdown'
import { CanLeaveWithUnsavedChanges } from '../../core/guards/unsaved-changes.guard'
import { AdminDataService } from '../../core/services/admin-data.service'
import { SelectOption } from '../../shared/interfaces/select-option'
import { Category, Product } from '../../shared/interfaces/product'
import { AdminChatterComponent } from './admin-chatter.component'
import { AdminConfirmationDialogComponent } from './admin-confirmation-dialog.component'
import { AdminSidebarComponent } from './admin-sidebar.component'
import { AdminPageHeaderComponent, AdminStateBlockComponent } from './admin-ui.component'

type AdminEntity = 'products' | 'categories' | 'promotions' | 'orders' | 'payments' | 'users'
type CrudMode = 'create' | 'view' | 'edit' | 'delete'

interface CrudField {
  key: string
  label: string
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'multiselect' | 'textarea' | 'imageList'
  required?: boolean
  readonly?: boolean
  help?: string
  options?: string[]
}

@Component({
  selector: 'app-admin-crud-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DropdownModule, AdminSidebarComponent, AdminChatterComponent, AdminConfirmationDialogComponent, AdminPageHeaderComponent, AdminStateBlockComponent],
  template: `
    <section class="admin-shell">
      <app-admin-sidebar />

      <div class="admin-shell-content">
        <section class="admin-page admin-crud-page record-page">
          <div class="record-layout record-page-layout">
            <section class="record-content">
              <div class="admin-crud-shell">
              <app-admin-page-header [eyebrow]="entityLabel" [title]="pageTitle" [description]="pageDescription">
                <a [routerLink]="listLink" class="secondary-button">Back to list</a>
              </app-admin-page-header>

              <app-admin-state-block *ngIf="loading" title="Loading record" message="Fetching the latest saved values." [loading]="true" />
              <app-admin-state-block *ngIf="error" title="Record unavailable" [message]="error" tone="error" />
              <div *ngIf="success" class="success-message">{{ success }}</div>

              <ng-container *ngIf="!loading">
                <div *ngIf="mode === 'view'" class="admin-details-card">
                  <div class="admin-form-grid readonly-form-grid">
                    <label
                      *ngFor="let field of previewFields"
                      [class.span-2]="field.type === 'textarea' || field.type === 'imageList'"
                      [class.timestamp-field]="isTimestampField(field.key)"
                      class="admin-form-field"
                    >
                      <span>{{ field.label }}</span>
                      <ng-container [ngSwitch]="field.type">
                        <textarea
                          *ngSwitchCase="'textarea'"
                          [ngModel]="displayValue(field.key)"
                          [name]="'readonly_' + field.key"
                          disabled
                        ></textarea>
                        <input
                          *ngSwitchCase="'select'"
                          type="text"
                          [ngModel]="displayValue(field.key)"
                          [name]="'readonly_' + field.key"
                          disabled
                        />
                        <div *ngSwitchCase="'multiselect'" class="readonly-related-list">
                          <ng-container *ngIf="selectedProductSummaries.length; else noRelatedProducts">
                            <a *ngFor="let product of selectedProductSummaries" [routerLink]="['/admin/products', product.id]">
                              <span>{{ product.name }}</span>
                              <small>{{ product.category || 'Uncategorized' }} · {{ product.price | currency }}</small>
                            </a>
                          </ng-container>
                          <ng-template #noRelatedProducts>No products are assigned to this promotion.</ng-template>
                        </div>
                        <div *ngSwitchCase="'imageList'" class="admin-image-list readonly-image-list">
                          <ng-container *ngIf="productImages.length; else noProductImages">
                            <a *ngFor="let image of productImages; let imageIndex = index" [href]="image" target="_blank" rel="noreferrer">
                              <img [src]="image" [alt]="'Product image ' + (imageIndex + 1)" loading="lazy" />
                              <span>Image {{ imageIndex + 1 }}</span>
                            </a>
                          </ng-container>
                          <ng-template #noProductImages>No images added.</ng-template>
                        </div>
                        <input
                          *ngSwitchDefault
                          [type]="field.type === 'password' ? 'text' : field.type"
                          [ngModel]="displayValue(field.key)"
                          [name]="'readonly_' + field.key"
                          disabled
                        />
                      </ng-container>
                    </label>
                  </div>
                  <div class="admin-crud-actions">
                    <a [routerLink]="listLink" class="secondary-button">Back</a>
                    <a [routerLink]="editLink" class="admin-create-link">Edit</a>
                    <button type="button" class="danger-button" (click)="openDeleteDialog()">Delete</button>
                  </div>
                </div>

                <form *ngIf="mode === 'create' || mode === 'edit'" class="admin-crud-form" #crudForm="ngForm" (ngSubmit)="save(crudForm)">
                  <div class="admin-form-grid">
                    <label
                      *ngFor="let field of formFields"
                      [class.span-2]="field.type === 'textarea' || field.type === 'imageList'"
                      [class.timestamp-field]="isTimestampField(field.key)"
                      class="admin-form-field"
                    >
                      <span>{{ field.label }} <em *ngIf="field.required">*</em></span>
                      <ng-container [ngSwitch]="field.type">
                        <textarea
                          *ngSwitchCase="'textarea'"
                          [(ngModel)]="form[field.key]"
                          [name]="field.key"
                          [required]="field.required"
                          [disabled]="field.readonly"
                        ></textarea>
                        <p-dropdown
                          *ngSwitchCase="'select'"
                          [(ngModel)]="form[field.key]"
                          [name]="field.key"
                          [required]="field.required"
                          [disabled]="field.readonly"
                          [options]="selectOptions(field)"
                          optionLabel="label"
                          optionValue="value"
                          [placeholder]="field.label"
                          appendTo="body"
                          [styleClass]="crudForm.submitted && field.required && isEmpty(form[field.key]) ? 'app-dropdown p-invalid' : 'app-dropdown'"
                        />
                        <div *ngSwitchCase="'multiselect'" class="promotion-picker-field">
                          <div class="promotion-picker-toolbar">
                            <button type="button" class="secondary-button" [disabled]="field.readonly || submitting" (click)="openProductPicker()">
                              Select products
                            </button>
                            <button type="button" class="ghost-button" [disabled]="field.readonly || submitting || !promotionSelectionCount" (click)="clearPromotionSelection()">
                              Clear all
                            </button>
                            <span>{{ promotionSelectionCount }} selected</span>
                          </div>
                          <div class="promotion-chip-list" *ngIf="selectedCategorySummaries.length || selectedProductSummaries.length; else noPromotionSelection">
                            <button
                              *ngFor="let category of selectedCategorySummaries"
                              type="button"
                              class="promotion-chip category-chip"
                              [disabled]="field.readonly || submitting"
                              (click)="removeSelectedCategory(category.id)"
                            >
                              Category: {{ category.name }} <span aria-hidden="true">x</span>
                            </button>
                            <button
                              *ngFor="let product of selectedProductSummaries"
                              type="button"
                              class="promotion-chip"
                              [disabled]="field.readonly || submitting"
                              (click)="removeSelectedProduct(product.id)"
                            >
                              {{ product.name }} <span aria-hidden="true">x</span>
                            </button>
                          </div>
                          <ng-template #noPromotionSelection>
                            <div class="empty-selection">No products or categories selected.</div>
                          </ng-template>
                        </div>
                        <div *ngSwitchCase="'imageList'" class="admin-image-list-editor">
                          <div *ngFor="let image of productImages; let imageIndex = index; trackBy: trackImageIndex" class="admin-image-input-row">
                            <input
                              type="text"
                              [ngModel]="productImages[imageIndex]"
                              (ngModelChange)="updateProductImage(imageIndex, $event)"
                              [name]="field.key + '_' + imageIndex"
                              [disabled]="field.readonly"
                              [placeholder]="'Image URL ' + (imageIndex + 1)"
                            />
                            <img *ngIf="productImages[imageIndex]" [src]="productImages[imageIndex]" [alt]="'Preview image ' + (imageIndex + 1)" loading="lazy" />
                          </div>
                          <span class="field-help">Add up to 5 images. The first image is used on product cards.</span>
                        </div>
                        <input
                          *ngSwitchDefault
                          [type]="field.type"
                          [ngModel]="field.readonly ? displayValue(field.key) : form[field.key]"
                          (ngModelChange)="!field.readonly && (form[field.key] = $event)"
                          [name]="field.key"
                          [required]="field.required"
                          [disabled]="field.readonly"
                          [attr.min]="field.type === 'number' ? 0 : null"
                        />
                      </ng-container>
                      <span *ngIf="field.help" class="field-help">{{ field.help }}</span>
                      <small *ngIf="crudForm.submitted && field.required && isEmpty(form[field.key])">{{ validationMessage(field) }}</small>
                    </label>
                  </div>

                  <div class="admin-crud-actions">
                    <a [routerLink]="listLink" class="secondary-button">Cancel</a>
                    <button type="submit" class="admin-save-button" [disabled]="submitting">
                      {{ submitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save changes' }}
                    </button>
                  </div>
                </form>
              </ng-container>
              </div>
            </section>

            <aside class="record-chatter">
              <app-admin-chatter
                [entityType]="chatterEntityType"
                [recordId]="mode === 'create' ? null : id"
                [allowComments]="mode !== 'delete'"
              />
            </aside>
          </div>

          <app-admin-confirmation-dialog
            *ngIf="deleteDialogOpen || mode === 'delete'"
            [title]="deleteTitle"
            [message]="deleteMessage"
            [confirmLabel]="deleteLabel"
            [loading]="deleting"
            [error]="deleteError"
            (cancel)="cancelDelete()"
            (confirm)="remove()"
          />

          <app-admin-confirmation-dialog
            *ngIf="discardDialogOpen"
            eyebrow="Unsaved changes"
            title="Discard unsaved changes?"
            message="You have changes that have not been saved. If you leave now, the edits on this page will be lost."
            cancelLabel="Keep editing"
            confirmLabel="Discard changes"
            tone="discard"
            [loading]="false"
            [error]="''"
            (cancel)="resolveDiscard(false)"
            (confirm)="resolveDiscard(true)"
          />

          <div *ngIf="productPickerOpen" class="promotion-picker-backdrop" [class.fullscreen]="productPickerFullscreen" (click)="closeProductPicker()">
            <section class="promotion-picker-modal" [class.fullscreen]="productPickerFullscreen" role="dialog" aria-modal="true" aria-labelledby="promotion-picker-title" (click)="$event.stopPropagation()">
              <header class="promotion-picker-header">
                <div>
                  <h2 id="promotion-picker-title">Select applicable products</h2>
                  <p class="muted">Choose individual products or entire categories that will receive this promotion.</p>
                </div>
                <div class="promotion-picker-window-actions">
                  <button type="button" class="icon-close-button" [attr.aria-label]="productPickerFullscreen ? 'Exit full page' : 'Open full page'" (click)="toggleProductPickerFullscreen()">
                    {{ productPickerFullscreen ? 'Minimize' : 'Expand' }}
                  </button>
                  <button type="button" class="icon-close-button" aria-label="Close" (click)="closeProductPicker()">x</button>
                </div>
              </header>

              <nav class="promotion-picker-tabs" aria-label="Promotion picker tabs">
                <button type="button" [class.active]="productPickerTab === 'products'" (click)="setProductPickerTab('products')">Products</button>
                <button type="button" [class.active]="productPickerTab === 'categories'" (click)="setProductPickerTab('categories')">Categories</button>
              </nav>

              <div class="promotion-picker-controls">
                <label>
                  <span>Search</span>
                  <input
                    type="search"
                    [(ngModel)]="productPickerSearch"
                    (ngModelChange)="resetPickerPage()"
                    name="productPickerSearch"
                    placeholder="Search name, SKU, or barcode..."
                  />
                </label>
                <label>
                  <span>Category</span>
                  <select
                    class="picker-filter-select"
                    [(ngModel)]="productPickerCategory"
                    name="productPickerCategory"
                    (ngModelChange)="resetPickerPage()"
                    aria-label="Category filter"
                  >
                    <option *ngFor="let option of productPickerCategoryOptions" [ngValue]="option.value">{{ option.label }}</option>
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select
                    class="picker-filter-select"
                    [(ngModel)]="productPickerStatus"
                    name="productPickerStatus"
                    (ngModelChange)="resetPickerPage()"
                    aria-label="Status filter"
                  >
                    <option *ngFor="let option of productPickerStatusOptions" [ngValue]="option.value">{{ option.label }}</option>
                  </select>
                </label>
                <label>
                  <span>Price range</span>
                  <select
                    class="picker-filter-select"
                    [(ngModel)]="productPickerPriceRange"
                    name="productPickerPriceRange"
                    (ngModelChange)="resetPickerPage()"
                    aria-label="Price range filter"
                  >
                    <option *ngFor="let option of productPickerPriceOptions" [ngValue]="option.value">{{ option.label }}</option>
                  </select>
                </label>
                <label>
                  <span>Brand</span>
                  <select
                    class="picker-filter-select"
                    [(ngModel)]="productPickerBrand"
                    name="productPickerBrand"
                    (ngModelChange)="resetPickerPage()"
                    aria-label="Brand filter"
                  >
                    <option *ngFor="let option of productPickerBrandOptions" [ngValue]="option.value">{{ option.label }}</option>
                  </select>
                </label>
                <label>
                  <span>Availability</span>
                  <select
                    class="picker-filter-select"
                    [(ngModel)]="productPickerAvailability"
                    name="productPickerAvailability"
                    (ngModelChange)="resetPickerPage()"
                    aria-label="Availability filter"
                  >
                    <option *ngFor="let option of productPickerAvailabilityOptions" [ngValue]="option.value">{{ option.label }}</option>
                  </select>
                </label>
                <label>
                  <span>Sort by</span>
                  <select
                    class="picker-filter-select"
                    [(ngModel)]="productPickerSort"
                    name="productPickerSort"
                    (ngModelChange)="resetPickerPage()"
                    aria-label="Sort filter"
                  >
                    <option *ngFor="let option of productPickerSortOptions" [ngValue]="option.value">{{ option.label }}</option>
                  </select>
                </label>
                <button type="button" class="secondary-button clear-filter-button" (click)="clearProductPickerFilters()">
                  Reset filters
                </button>
                <button type="button" class="secondary-button clear-filter-button">
                  Advanced filters
                </button>
              </div>

              <div class="promotion-picker-body">
                <div class="promotion-picker-main">
                  <div *ngIf="productPickerTab === 'products'" class="promotion-picker-table-wrap">
                    <table class="promotion-picker-table">
                      <thead>
                        <tr>
                          <th>
                            <input
                              type="checkbox"
                              [checked]="allFilteredSelected"
                              [disabled]="filteredPickerProducts.length === 0"
                              (change)="toggleAllFilteredProducts($event)"
                            />
                          </th>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Barcode</th>
                          <th>Category</th>
                          <th>Brand</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          *ngFor="let product of pagedPickerProducts; trackBy: trackProductById"
                          [class.is-selected]="isDraftProductSelected(product.id)"
                          role="button"
                          tabindex="0"
                          (click)="toggleDraftProduct(product.id)"
                          (keydown.enter)="toggleDraftProduct(product.id)"
                          (keydown.space)="toggleDraftProduct(product.id); $event.preventDefault()"
                        >
                          <td>
                            <input
                              type="checkbox"
                              [checked]="isDraftProductSelected(product.id)"
                              (click)="$event.stopPropagation()"
                              (change)="toggleDraftProduct(product.id)"
                            />
                          </td>
                          <td>
                            <div class="picker-product-cell">
                              <img class="picker-product-image" [src]="productImage(product)" [alt]="product.name" loading="lazy" />
                              <div>
                                <strong>{{ product.name }}</strong>
                                <small>{{ productBarcode(product) }}</small>
                              </div>
                            </div>
                          </td>
                          <td>{{ productSku(product) }}</td>
                          <td>{{ productBarcode(product) }}</td>
                          <td>{{ product.category || categoryNameForId(product.category_id || null) || 'Uncategorized' }}</td>
                          <td>{{ productBrand(product) }}</td>
                          <td>{{ product.price | currency }}</td>
                          <td>{{ productStock(product) }}</td>
                          <td>
                            <span class="status-pill" [class.inactive]="productStatus(product) === 'Inactive'">{{ productStatus(product) }}</span>
                          </td>
                        </tr>
                        <tr *ngIf="filteredPickerProducts.length === 0">
                          <td colspan="9" class="empty-table-cell">
                            <div class="empty-picker-state">
                              <strong>No products found</strong>
                              <span>Try resetting filters or checking another category.</span>
                              <button type="button" class="secondary-button" (click)="clearProductPickerFilters()">Reset filters</button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div class="promotion-picker-pagination" *ngIf="filteredPickerProducts.length">
                      <span>Showing {{ pickerRangeStart }} to {{ pickerRangeEnd }} of {{ filteredPickerProducts.length }} products</span>
                      <div>
                        <span class="rows-per-page">Rows: {{ productPickerPageSize }}</span>
                        <button type="button" class="secondary-button" [disabled]="productPickerPage === 1" (click)="goToPickerPage(productPickerPage - 1)">Prev</button>
                        <button
                          type="button"
                          class="secondary-button"
                          *ngFor="let page of pickerPages"
                          [class.active]="page === productPickerPage"
                          (click)="goToPickerPage(page)"
                        >
                          {{ page }}
                        </button>
                        <button type="button" class="secondary-button" [disabled]="productPickerPage === pickerPageCount" (click)="goToPickerPage(productPickerPage + 1)">Next</button>
                      </div>
                    </div>
                  </div>

                  <div *ngIf="productPickerTab === 'categories'" class="promotion-category-grid">
                    <button
                      *ngFor="let category of categories"
                      type="button"
                      class="promotion-category-card"
                      [class.selected]="isDraftCategorySelected(category.id)"
                      (click)="toggleDraftCategory(category.id)"
                    >
                      <img [src]="categoryImage(category)" [alt]="category.name" />
                      <span>{{ category.name }}</span>
                      <strong>{{ productsInCategory(category.id).length }} products</strong>
                      <small>{{ category.description || 'No category description yet.' }}</small>
                      <em>{{ isDraftCategorySelected(category.id) ? 'Selected' : 'Select entire category' }}</em>
                    </button>
                  </div>
                </div>

                <aside class="promotion-selection-summary">
                  <h3>Selection summary</h3>
                  <div>
                    <span>Products</span>
                    <strong>{{ draftProductIds.length }}</strong>
                  </div>
                  <div>
                    <span>Categories</span>
                    <strong>{{ draftCategoryIds.length }}</strong>
                  </div>
                  <div>
                    <span>Total applicable</span>
                    <strong>{{ totalApplicableDraftProducts }}</strong>
                  </div>
                  <details open>
                    <summary>Promotion preview</summary>
                    <p>Products from selected categories are included in the total.</p>
                  </details>
                  <details>
                    <summary>Included categories</summary>
                    <button *ngFor="let category of draftCategorySummaries" type="button" (click)="setProductPickerTab('categories')">
                      {{ category.name }}
                    </button>
                    <span *ngIf="draftCategorySummaries.length === 0">No categories selected.</span>
                  </details>
                  <details>
                    <summary>Selected products</summary>
                    <button *ngFor="let product of draftProductSummaries" type="button" (click)="setProductPickerTab('products')">
                      {{ product.name }}
                    </button>
                    <span *ngIf="draftProductSummaries.length === 0">No individual products selected.</span>
                  </details>
                  <nav>
                    <button type="button" (click)="setProductPickerTab('products')">View products</button>
                    <button type="button" (click)="setProductPickerTab('categories')">View categories</button>
                    <button type="button" (click)="clearDraftSelection()">Clear all</button>
                  </nav>
                </aside>
              </div>

              <footer class="promotion-picker-actions">
                <button type="button" class="secondary-button" (click)="closeProductPicker()">Cancel</button>
                <button type="button" class="admin-save-button" [disabled]="totalApplicableDraftProducts === 0" (click)="applyProductSelection()">
                  Apply to {{ totalApplicableDraftProducts }} Products
                </button>
              </footer>
            </section>
          </div>
        </section>
      </div>
    </section>
  `
})
export class AdminCrudPageComponent implements OnInit, CanLeaveWithUnsavedChanges {
  entity: AdminEntity = 'products'
  mode: CrudMode = 'create'
  id = ''
  loading = false
  error = ''
  success = ''
  submitting = false
  deleting = false
  deleteDialogOpen = false
  deleteError = ''
  discardDialogOpen = false
  form: Record<string, any> = {}
  fieldsList: CrudField[] = []
  formFieldsList: CrudField[] = []
  previewFieldsList: CrudField[] = []
  categories: Category[] = []
  products: Product[] = []
  productPickerOpen = false
  productPickerSearch = ''
  productPickerCategory = ''
  productPickerStatus = 'all'
  productPickerPriceRange = 'all'
  productPickerBrand = 'all'
  productPickerAvailability = 'all'
  productPickerSort = 'name-asc'
  productPickerSelectedOnly = false
  productPickerTab: 'products' | 'categories' = 'products'
  productPickerPage = 1
  productPickerPageSize = 18
  productPickerFullscreen = false
  draftProductIds: number[] = []
  draftCategoryIds: number[] = []
  private initialFormState = ''
  private saved = false
  private discardResolver?: (discard: boolean) => void

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminData: AdminDataService
  ) {}

  ngOnInit() {
    this.entity = (this.route.snapshot.data['entity'] || 'products') as AdminEntity
    this.mode = (this.route.snapshot.data['mode'] || 'create') as CrudMode
    this.id = this.route.snapshot.paramMap.get('id') || ''
    this.form = this.emptyForm()
    this.setFields()
    this.captureInitialState()
    this.loadSupportingData()

    if (this.mode !== 'create' && this.id) {
      this.loadRecord()
    }
  }

  get entityLabel(): string {
    return this.entity.toUpperCase()
  }

  get entitySingular(): string {
    return this.entity === 'products' ? 'Product' : this.entity === 'categories' ? 'Category' : this.entity === 'promotions' ? 'Promotion' : this.entity === 'orders' ? 'Order' : this.entity === 'payments' ? 'Payment' : 'User'
  }

  get pageTitle(): string {
    const action = this.mode === 'create' ? 'Create' : this.mode === 'edit' ? 'Edit' : this.mode === 'delete' ? 'Delete' : 'View'
    return `${action} ${this.entitySingular.toLowerCase()}`
  }

  get deleteTitle(): string {
    return `Delete ${this.entitySingular.toLowerCase()}?`
  }

  get deleteLabel(): string {
    return `Delete ${this.entitySingular.toLowerCase()}`
  }

  get deleteMessage(): string {
    if (this.entity === 'categories') {
      return 'This category may contain products. Deleting it could affect product organization. This action cannot be undone.'
    }
    if (this.entity === 'orders') {
      return 'This removes the order record from the admin database. This action cannot be undone.'
    }
    if (this.entity === 'promotions') {
      return 'This removes the promotion record. Products using it may lose their promotion reference.'
    }
    if (this.entity === 'users') {
      return 'This removes the user account. Confirm that this account is not required for admin access.'
    }
    return 'This action permanently deletes the product and cannot be undone.'
  }

  get pageDescription(): string {
    if (this.mode === 'delete') {
      return `Confirm before deleting this ${this.entitySingular.toLowerCase()}.`
    }
    if (this.mode === 'view') {
      return `Review this ${this.entitySingular.toLowerCase()} record.`
    }
    return `Fill the fields below to ${this.mode === 'create' ? 'create' : 'update'} a ${this.entitySingular.toLowerCase()}.`
  }

  get listLink(): string {
    return `/admin/${this.entity}`
  }

  get editLink(): string {
    return `/admin/${this.entity}/${this.id}/edit`
  }

  get chatterEntityType(): string {
    if (this.entity === 'products') {
      return 'PRODUCT'
    }
    if (this.entity === 'categories') {
      return 'CATEGORY'
    }
    if (this.entity === 'orders' || this.entity === 'payments') {
      return 'ORDER'
    }
    if (this.entity === 'promotions') {
      return 'PROMOTION'
    }
    return 'USER'
  }

  private setFields() {
    this.fieldsList = this.buildFields()
    this.formFieldsList = this.mode === 'create'
      ? this.fieldsList.filter(field => !field.readonly)
      : this.fieldsList
    this.previewFieldsList = this.fieldsList.filter(field => field.key !== 'password' && field.key !== 'confirm_password')
  }

  private buildFields(): CrudField[] {
    if (this.entity === 'orders') {
      return [
        { key: 'user_id', label: 'User ID', type: 'number', required: true },
        { key: 'status', label: 'Status', type: 'select', required: true, options: ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] },
        { key: 'payment_status', label: 'Payment status', type: 'select', options: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] },
        { key: 'payment_method', label: 'Payment method', type: 'select', options: ['CASH', 'ONLINE'] },
        { key: 'delivery_type', label: 'Delivery type', type: 'select', options: ['PICKUP', 'DELIVERY'] },
        { key: 'total_amount', label: 'Total amount', type: 'number', readonly: this.mode === 'edit', help: this.mode === 'edit' ? 'Totals are calculated by the backend order flow.' : undefined },
        { key: 'delivery_address', label: 'Delivery address', type: 'textarea' },
        { key: 'id', label: 'Order ID', type: 'number', readonly: true },
        { key: 'created_at', label: 'Created at', type: 'text', readonly: true },
        { key: 'updated_at', label: 'Updated at', type: 'text', readonly: true }
      ]
    }

    if (this.entity === 'payments') {
      return [
        { key: 'id', label: 'Payment ID', type: 'number', readonly: true },
        { key: 'order_id', label: 'Order ID', type: 'number', readonly: true },
        { key: 'user_id', label: 'User ID', type: 'number', readonly: true },
        { key: 'payment_status', label: 'Payment status', type: 'select', required: true, options: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] },
        { key: 'payment_method', label: 'Payment method', type: 'select', required: true, options: ['CASH', 'ONLINE'] },
        { key: 'total_amount', label: 'Amount', type: 'number', readonly: true },
        { key: 'status', label: 'Order status', type: 'select', readonly: true, options: ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] },
        { key: 'delivery_type', label: 'Delivery type', type: 'select', readonly: true, options: ['PICKUP', 'DELIVERY'] },
        { key: 'delivery_address', label: 'Delivery address', type: 'textarea', readonly: true },
        { key: 'created_at', label: 'Created at', type: 'text', readonly: true },
        { key: 'updated_at', label: 'Updated at', type: 'text', readonly: true }
      ]
    }

    if (this.entity === 'categories') {
      return [
        { key: 'id', label: 'Category ID', type: 'number', readonly: true },
        { key: 'name', label: 'Category name', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'created_at', label: 'Created at', type: 'text', readonly: true },
        { key: 'updated_at', label: 'Updated at', type: 'text', readonly: true }
      ]
    }

    if (this.entity === 'promotions') {
      return [
        { key: 'id', label: 'Promotion ID', type: 'number', readonly: true },
        { key: 'name', label: 'Promotion name', type: 'text', required: true },
        { key: 'type', label: 'Promotion type', type: 'select', required: true, options: ['FIXED', 'PERCENT'] },
        { key: 'value', label: 'Value', type: 'number', required: true },
        { key: 'is_active', label: 'Promotion status', type: 'select', options: ['true', 'false'] },
        { key: 'productIds', label: 'Applicable products', type: 'multiselect', required: true }
      ]
    }

    if (this.entity === 'users') {
      return [
        { key: 'id', label: 'User ID', type: 'number', readonly: true },
        { key: 'name', label: 'Display name', type: 'text' },
        { key: 'firstname', label: 'First name', type: 'text', required: true },
        { key: 'lastname', label: 'Last name', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'role', label: 'Role', type: 'select', options: ['CUSTOMER', 'ADMIN', 'MANAGER', 'DELIVERY'] },
        { key: 'is_active', label: 'Account status', type: 'select', readonly: true, options: ['true', 'false'], help: 'Status is read-only because the current backend update endpoint does not change it.' },
        { key: 'password', label: this.mode === 'create' ? 'Password' : 'New password', type: 'password', required: this.mode === 'create' },
        { key: 'confirm_password', label: 'Confirm password', type: 'password', required: this.mode === 'create' },
        { key: 'created_at', label: 'Created at', type: 'text', readonly: true },
        { key: 'updated_at', label: 'Updated at', type: 'text', readonly: true }
      ]
    }

    return [
      { key: 'id', label: 'Product ID', type: 'number', readonly: true },
      { key: 'name', label: 'Product name', type: 'text', required: true },
      { key: 'price', label: 'Price', type: 'number', required: true },
      { key: 'category_id', label: 'Category', type: 'select', options: this.categoryOptionValues },
      { key: 'active_promotions', label: 'Active promotions', type: 'text', readonly: true, help: 'Promotions are managed from the Promotion page.' },
      { key: 'images', label: 'Product images', type: 'imageList' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'created_at', label: 'Created at', type: 'text', readonly: true },
      { key: 'updated_at', label: 'Updated at', type: 'text', readonly: true }
    ]
  }

  get formFields(): CrudField[] {
    return this.formFieldsList
  }

  get previewFields(): CrudField[] {
    return this.previewFieldsList
  }

  displayValue(key: string): string {
    const value = this.form[key]

    if (value === null || value === undefined || value === '') {
      return 'None'
    }

    if (this.isTimestampField(key)) {
      return this.formatTimestamp(value)
    }

    if (this.entity === 'products' && key === 'category_id') {
      return this.categoryNameForId(Number(value)) || String(value)
    }

    if (this.entity === 'products' && key === 'active_promotions') {
      return this.form['promotion']?.name || 'No active promotions'
    }

    if ((this.entity === 'promotions' || this.entity === 'users') && key === 'is_active') {
      return value === true || value === 'true' ? 'Active' : 'Inactive'
    }

    return String(value)
  }

  isTimestampField(key: string): boolean {
    return key === 'created_at' || key === 'updated_at'
  }

  private formatTimestamp(value: unknown): string {
    const date = new Date(String(value))

    if (Number.isNaN(date.getTime())) {
      return String(value)
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  }

  hasUnsavedChanges(): boolean {
    if (this.saved || (this.mode !== 'create' && this.mode !== 'edit')) {
      return false
    }

    return JSON.stringify(this.form) !== this.initialFormState
  }

  confirmDiscardChanges(): Promise<boolean> {
    if (this.discardDialogOpen) {
      return Promise.resolve(false)
    }

    this.discardDialogOpen = true
    return new Promise(resolve => {
      this.discardResolver = resolve
    })
  }

  resolveDiscard(discard: boolean) {
    this.discardDialogOpen = false
    this.discardResolver?.(discard)
    this.discardResolver = undefined
  }

  @HostListener('window:beforeunload', ['$event'])
  warnBeforeUnload(event: BeforeUnloadEvent) {
    if (!this.hasUnsavedChanges()) {
      return
    }

    event.preventDefault()
    event.returnValue = ''
  }

  validationMessage(field: CrudField): string {
    if (field.required) {
      return `${field.label} is required.`
    }
    return `Enter a valid ${field.label.toLowerCase()}.`
  }

  isEmpty(value: unknown): boolean {
    return value === null || value === undefined || String(value).trim() === ''
  }

  selectOptions(field: CrudField): SelectOption<string>[] {
    if (this.entity === 'products' && field.key === 'category_id') {
      return this.categorySelectOptions
    }

    if (field.key === 'is_active') {
      return [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    }

    return (field.options || []).map(option => ({ value: option, label: option }))
  }

  get selectedProductSummaries(): Product[] {
    const ids = new Set((this.form['productIds'] || []).map((id: unknown) => Number(id)))
    const productsFromResponse = Array.isArray(this.form['products']) ? this.form['products'] as Product[] : []
    const allProducts = [...productsFromResponse, ...this.products]
    const seen = new Set<number>()

    return allProducts.filter(product => {
      if (!ids.has(Number(product.id)) || seen.has(Number(product.id))) {
        return false
      }
      seen.add(Number(product.id))
      return true
    })
  }

  get selectedCategorySummaries(): Category[] {
    const ids = new Set((this.form['categoryIds'] || []).map((id: unknown) => Number(id)))
    return this.categories.filter(category => ids.has(Number(category.id)))
  }

  get promotionSelectionCount(): number {
    return this.normalizedIds(this.form['productIds']).length + this.normalizedIds(this.form['categoryIds']).length
  }

  get draftSelectionCount(): number {
    return this.draftProductIds.length + this.draftCategoryIds.length
  }

  get productPickerStatusOptions(): SelectOption<string>[] {
    return [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]
  }

  get productPickerCategoryOptions(): SelectOption<string>[] {
    return [
      { value: '', label: 'All categories' },
      ...this.categories.map(category => ({ value: String(category.id), label: category.name }))
    ]
  }

  get productPickerPriceOptions(): SelectOption<string>[] {
    return [
      { value: 'all', label: 'All prices' },
      { value: '0-75', label: '₪0 - ₪75' },
      { value: '75-150', label: '₪75 - ₪150' },
      { value: '150+', label: '₪150+' }
    ]
  }

  get productPickerBrandOptions(): SelectOption<string>[] {
    const brands = Array.from(new Set(this.products.map(product => this.productBrand(product)))).sort()
    return [
      { value: 'all', label: 'All brands' },
      ...brands.map(brand => ({ value: brand, label: brand }))
    ]
  }

  get productPickerAvailabilityOptions(): SelectOption<string>[] {
    return [
      { value: 'all', label: 'All availability' },
      { value: 'in-stock', label: 'In stock' },
      { value: 'out-of-stock', label: 'Out of stock' }
    ]
  }

  get productPickerSortOptions(): SelectOption<string>[] {
    return [
      { value: 'name-asc', label: 'Name A-Z' },
      { value: 'price-asc', label: 'Price low to high' },
      { value: 'price-desc', label: 'Price high to low' },
      { value: 'updated-desc', label: 'Last updated' }
    ]
  }

  get filteredPickerProducts(): Product[] {
    const search = this.productPickerSearch.trim().toLowerCase()

    const filtered = this.products.filter(product => {
      const categoryMatches = !this.productPickerCategory || String(product.category_id || '') === this.productPickerCategory
      const status = this.productStatus(product).toLowerCase()
      const statusMatches = this.productPickerStatus === 'all' || status === this.productPickerStatus
      const priceMatches = this.priceRangeMatches(product)
      const brandMatches = this.productPickerBrand === 'all' || this.productBrand(product) === this.productPickerBrand
      const availabilityMatches = this.productPickerAvailability === 'all' || this.productAvailability(product) === this.productPickerAvailability
      const selectedMatches = !this.productPickerSelectedOnly || this.isDraftProductSelected(product.id)
      const searchable = [
        product.name,
        product.category || '',
        this.productSku(product),
        this.productBarcode(product),
        this.productBrand(product)
      ].join(' ').toLowerCase()

      return categoryMatches && statusMatches && priceMatches && brandMatches && availabilityMatches && selectedMatches && (!search || searchable.includes(search))
    })

    return filtered.sort((a, b) => {
      if (this.productPickerSort === 'price-asc') {
        return Number(a.price) - Number(b.price)
      }
      if (this.productPickerSort === 'price-desc') {
        return Number(b.price) - Number(a.price)
      }
      if (this.productPickerSort === 'updated-desc') {
        return String(b.updated_at || '').localeCompare(String(a.updated_at || ''))
      }
      return a.name.localeCompare(b.name)
    })
  }

  get allFilteredSelected(): boolean {
    return this.filteredPickerProducts.length > 0 && this.filteredPickerProducts.every(product => this.isDraftProductSelected(product.id))
  }

  get pickerPageCount(): number {
    return Math.max(1, Math.ceil(this.filteredPickerProducts.length / this.productPickerPageSize))
  }

  get pickerPages(): number[] {
    return Array.from({ length: this.pickerPageCount }, (_, index) => index + 1)
  }

  get pagedPickerProducts(): Product[] {
    const page = Math.min(this.productPickerPage, this.pickerPageCount)
    const start = (page - 1) * this.productPickerPageSize
    return this.filteredPickerProducts.slice(start, start + this.productPickerPageSize)
  }

  get pickerRangeStart(): number {
    return this.filteredPickerProducts.length ? ((Math.min(this.productPickerPage, this.pickerPageCount) - 1) * this.productPickerPageSize) + 1 : 0
  }

  get pickerRangeEnd(): number {
    return Math.min(this.filteredPickerProducts.length, Math.min(this.productPickerPage, this.pickerPageCount) * this.productPickerPageSize)
  }

  get totalApplicableDraftProducts(): number {
    const ids = new Set(this.draftProductIds.map(id => Number(id)))
    this.draftCategoryIds.forEach(categoryId => {
      this.productsInCategory(categoryId).forEach(product => ids.add(Number(product.id)))
    })
    return ids.size
  }

  get draftProductSummaries(): Product[] {
    const ids = new Set(this.draftProductIds.map(id => Number(id)))
    return this.products.filter(product => ids.has(Number(product.id)))
  }

  get draftCategorySummaries(): Category[] {
    const ids = new Set(this.draftCategoryIds.map(id => Number(id)))
    return this.categories.filter(category => ids.has(Number(category.id)))
  }

  private get categoryOptionValues(): string[] {
    return this.categories.map(category => String(category.id))
  }

  private get categorySelectOptions(): SelectOption<string>[] {
    return this.categories.map(category => ({
      value: String(category.id),
      label: category.name
    }))
  }

  openDeleteDialog() {
    this.deleteError = ''
    this.deleteDialogOpen = true
  }

  cancelDelete() {
    if (this.deleting) {
      return
    }
    if (this.mode === 'delete') {
      this.router.navigate([this.listLink])
      return
    }
    this.deleteDialogOpen = false
    this.deleteError = ''
  }

  openProductPicker() {
    this.draftProductIds = this.normalizedIds(this.form['productIds'])
    this.draftCategoryIds = this.normalizedIds(this.form['categoryIds'])
    this.productPickerSearch = ''
    this.productPickerCategory = ''
    this.productPickerStatus = 'all'
    this.productPickerPriceRange = 'all'
    this.productPickerBrand = 'all'
    this.productPickerAvailability = 'all'
    this.productPickerSort = 'name-asc'
    this.productPickerSelectedOnly = false
    this.productPickerTab = 'products'
    this.productPickerPage = 1
    this.productPickerFullscreen = true
    this.updateProductPickerPageSize()
    this.productPickerOpen = true
  }

  closeProductPicker() {
    this.productPickerFullscreen = false
    this.productPickerOpen = false
  }

  toggleProductPickerFullscreen() {
    this.productPickerFullscreen = !this.productPickerFullscreen
    this.updateProductPickerPageSize()
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.productPickerOpen) {
      this.updateProductPickerPageSize()
    }
  }

  applyProductSelection() {
    this.form['productIds'] = this.normalizedIds(this.draftProductIds)
    this.form['categoryIds'] = this.normalizedIds(this.draftCategoryIds)
    this.productPickerOpen = false
  }

  clearPromotionSelection() {
    this.form['productIds'] = []
    this.form['categoryIds'] = []
  }

  setProductPickerTab(tab: 'products' | 'categories') {
    this.productPickerTab = tab
  }

  resetPickerPage() {
    this.productPickerPage = 1
  }

  clearProductPickerFilters() {
    this.productPickerSearch = ''
    this.productPickerCategory = ''
    this.productPickerStatus = 'all'
    this.productPickerPriceRange = 'all'
    this.productPickerBrand = 'all'
    this.productPickerAvailability = 'all'
    this.productPickerSort = 'name-asc'
    this.productPickerSelectedOnly = false
    this.resetPickerPage()
  }

  goToPickerPage(page: number) {
    this.productPickerPage = Math.min(Math.max(1, page), this.pickerPageCount)
  }

  private updateProductPickerPageSize() {
    const height = typeof window === 'undefined' ? 800 : window.innerHeight
    const nextSize = this.productPickerFullscreen
      ? height >= 980 ? 20 : height >= 840 ? 15 : 12
      : height >= 900 ? 15 : 10
    if (nextSize !== this.productPickerPageSize) {
      this.productPickerPageSize = nextSize
      this.goToPickerPage(this.productPickerPage)
    }
  }

  toggleSelectedOnly() {
    this.productPickerSelectedOnly = !this.productPickerSelectedOnly
    this.resetPickerPage()
  }

  clearDraftSelection() {
    this.draftProductIds = []
    this.draftCategoryIds = []
    this.productPickerSelectedOnly = false
    this.resetPickerPage()
  }

  removeSelectedProduct(id: number) {
    this.form['productIds'] = this.normalizedIds(this.form['productIds']).filter(productId => productId !== Number(id))
  }

  removeSelectedCategory(id: number) {
    this.form['categoryIds'] = this.normalizedIds(this.form['categoryIds']).filter(categoryId => categoryId !== Number(id))
  }

  isDraftProductSelected(id: number): boolean {
    return this.draftProductIds.includes(Number(id))
  }

  toggleDraftProduct(id: number) {
    const productId = Number(id)
    this.draftProductIds = this.isDraftProductSelected(productId)
      ? this.draftProductIds.filter(selectedId => selectedId !== productId)
      : [...this.draftProductIds, productId]
  }

  selectAllFilteredProducts() {
    this.draftProductIds = this.normalizedIds([...this.draftProductIds, ...this.filteredPickerProducts.map(product => product.id)])
  }

  toggleAllFilteredProducts(event: Event) {
    const checked = (event.target as HTMLInputElement).checked
    if (checked) {
      this.selectAllFilteredProducts()
      return
    }
    const filteredIds = new Set(this.filteredPickerProducts.map(product => Number(product.id)))
    this.draftProductIds = this.draftProductIds.filter(id => !filteredIds.has(Number(id)))
  }

  applyCurrentCategory() {
    const categoryId = Number(this.productPickerCategory)
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return
    }
    this.draftCategoryIds = this.normalizedIds([...this.draftCategoryIds, categoryId])
    const categoryProducts = this.products
      .filter(product => Number(product.category_id) === categoryId)
      .map(product => product.id)
    this.draftProductIds = this.normalizedIds([...this.draftProductIds, ...categoryProducts])
  }

  isDraftCategorySelected(id: number): boolean {
    return this.draftCategoryIds.includes(Number(id))
  }

  toggleDraftCategory(id: number) {
    const categoryId = Number(id)
    this.draftCategoryIds = this.isDraftCategorySelected(categoryId)
      ? this.draftCategoryIds.filter(selectedId => selectedId !== categoryId)
      : this.normalizedIds([...this.draftCategoryIds, categoryId])
  }

  productsInCategory(id: number): Product[] {
    return this.products.filter(product => Number(product.category_id) === Number(id))
  }

  trackProductById(_index: number, product: Product): number {
    return Number(product.id)
  }

  productSku(product: Product): string {
    return product.sku || `SKU-${product.id}`
  }

  productBarcode(product: Product): string {
    return product.barcode || `Barcode ${product.id}`
  }

  productBrand(product: Product): string {
    const words = product.name.split(' ').filter(Boolean)
    return words[0] || '7 Stars'
  }

  productStock(product: Product): string {
    return this.productStatus(product) === 'Inactive' ? '0' : 'In stock'
  }

  productAvailability(product: Product): string {
    return this.productStatus(product) === 'Inactive' ? 'out-of-stock' : 'in-stock'
  }

  productUpdatedAt(product: Product): string {
    if (!product.updated_at) {
      return 'Not tracked'
    }
    return new Date(product.updated_at).toLocaleDateString()
  }

  categoryImage(category: Category): string {
    return `https://placehold.co/420x220/fff0f1/111111?text=${encodeURIComponent(category.name)}`
  }

  private priceRangeMatches(product: Product): boolean {
    const price = Number(product.price) || 0
    if (this.productPickerPriceRange === '0-75') {
      return price >= 0 && price <= 75
    }
    if (this.productPickerPriceRange === '75-150') {
      return price > 75 && price <= 150
    }
    if (this.productPickerPriceRange === '150+') {
      return price > 150
    }
    return true
  }

  productStatus(product: Product): 'Active' | 'Inactive' {
    const rawStatus = String(product.status || '').toLowerCase()
    if (rawStatus === 'inactive' || product.is_active === false) {
      return 'Inactive'
    }
    return 'Active'
  }

  productImage(product: Product): string {
    return product.images?.[0] || product.url || `https://placehold.co/96x72/fff0f1/111111?text=${encodeURIComponent(product.name)}`
  }

  get productImages(): string[] {
    const images = Array.isArray(this.form['images']) ? this.form['images'] : []
    return Array.from({ length: 5 }, (_, index) => String(images[index] || ''))
  }

  updateProductImage(index: number, value: string) {
    const images = this.productImages
    images[index] = value
    this.form['images'] = images
  }

  trackImageIndex(index: number): number {
    return index
  }

  save(crudForm?: { invalid?: boolean; form?: { markAllAsTouched: () => void } }) {
    if (crudForm?.invalid || this.submitting) {
      crudForm?.form?.markAllAsTouched()
      return
    }

    if (this.entity === 'users' && this.form['password'] && this.form['password'] !== this.form['confirm_password']) {
      this.error = 'Passwords do not match.'
      return
    }

    if (this.entity === 'promotions' && this.promotionSelectionCount === 0) {
      this.error = 'Select at least one product or category before saving the promotion.'
      return
    }

    this.error = ''
    this.submitting = true
    const payload = this.payload()
    const request = this.mode === 'create'
      ? this.create(payload)
      : this.update(payload)

    request.pipe(finalize(() => {
      this.submitting = false
    })).subscribe({
      next: createdOrUpdated => {
        this.saved = true
        this.success = `${this.entitySingular} ${this.mode === 'create' ? 'created' : 'updated'} successfully.`
        const record = this.extractRecord(createdOrUpdated)
        const recordId = record?.id || this.id
        this.router.navigate([`/admin/${this.entity}/${recordId}`])
      },
      error: () => {
        this.error = `Could not ${this.mode === 'create' ? 'create' : 'update'} ${this.entitySingular.toLowerCase()}.`
      }
    })
  }

  remove() {
    if (this.deleting) {
      return
    }

    this.deleteError = ''
    this.deleting = true
    this.deleteRecord().pipe(finalize(() => {
      this.deleting = false
    })).subscribe({
      next: () => this.router.navigate([this.listLink]),
      error: () => {
        this.deleteError = `Could not delete ${this.entitySingular.toLowerCase()}.`
      }
    })
  }

  private loadRecord() {
    this.loading = true
    this.read().pipe(
      timeout(8000),
      finalize(() => {
        this.loading = false
      })
    ).subscribe({
      next: record => {
        this.form = this.normalizeLoadedRecord({ ...this.emptyForm(), ...record })
        this.captureInitialState()
      },
      error: () => {
        this.error = `Could not load ${this.entitySingular.toLowerCase()}.`
      }
    })
  }

  private loadSupportingData() {
    if (this.entity === 'products') {
      this.adminData.loadCategories().subscribe({
        next: categories => {
          this.categories = categories
          this.setFields()
          if (this.form['category_id']) {
            this.form['category_id'] = String(this.form['category_id'])
          }
          this.captureInitialState()
        },
        error: () => {
          this.categories = []
        }
      })
    }

    if (this.entity === 'promotions') {
      this.adminData.loadCategories().subscribe({
        next: categories => {
          this.categories = categories
          this.setFields()
          this.captureInitialState()
        },
        error: () => {
          this.categories = []
        }
      })
      this.adminData.loadProducts().subscribe({
        next: products => {
          this.products = products
          this.setFields()
          this.captureInitialState()
        },
        error: () => {
          this.products = []
        }
      })
    }
  }

  private emptyForm(): Record<string, any> {
    if (this.entity === 'orders') {
      return { id: '', user_id: '', status: 'PENDING', total_amount: 0, payment_status: 'PENDING', payment_method: 'CASH', delivery_type: 'PICKUP', delivery_address: '', created_at: '', updated_at: '' }
    }
    if (this.entity === 'payments') {
      return { id: '', order_id: '', user_id: '', status: 'PENDING', total_amount: 0, payment_status: 'PENDING', payment_method: 'CASH', delivery_type: 'PICKUP', delivery_address: '', created_at: '', updated_at: '' }
    }
    if (this.entity === 'users') {
      return { id: '', name: '', firstname: '', lastname: '', email: '', phone: '', role: 'CUSTOMER', is_active: 'true', password: '', confirm_password: '', created_at: '', updated_at: '' }
    }
    if (this.entity === 'categories') {
      return { id: '', name: '', description: '', created_at: '', updated_at: '' }
    }
    if (this.entity === 'promotions') {
      return { id: '', name: '', type: 'PERCENT', value: '', is_active: 'true', productIds: [], categoryIds: [], products: [] }
    }
    return { id: '', name: '', price: '', category_id: '', active_promotions: '', images: ['', '', '', '', ''], description: '', created_at: '', updated_at: '' }
  }

  private captureInitialState() {
    this.initialFormState = JSON.stringify(this.form)
  }

  private payload(): Record<string, any> {
    const payload = this.normalizedForm()
    delete payload['id']
    delete payload['created_at']
    delete payload['updated_at']
    delete payload['confirm_password']
    delete payload['active_promotions']
    delete payload['products']
    delete payload['promotion']
    delete payload['promotion_id']
    delete payload['order_id']

    if (this.entity === 'products') {
      payload['price'] = Number(payload['price']) || 0
      payload['category_id'] = payload['category_id'] ? Number(payload['category_id']) : null
      payload['category'] = this.categoryNameForId(payload['category_id'])
      payload['images'] = this.normalizeProductImages(payload['images'])
      payload['url'] = payload['images'][0] || ''
    }
    if (this.entity === 'orders' || this.entity === 'payments') {
      payload['user_id'] = Number(payload['user_id'])
      payload['total_amount'] = Number(payload['total_amount']) || 0
    }
    if (this.entity === 'promotions') {
      payload['value'] = Number(payload['value']) || 0
      payload['is_active'] = payload['is_active'] === true || payload['is_active'] === 'true'
      payload['productIds'] = Array.from(new Set((payload['productIds'] || []).map((id: unknown) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0)))
      payload['categoryIds'] = Array.from(new Set((payload['categoryIds'] || []).map((id: unknown) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0)))
    }
    if (this.entity === 'users') {
      delete payload['is_active']
    }
    if (this.entity === 'users' && !payload['password']) {
      delete payload['password']
    }
    return payload
  }

  private normalizedForm(): Record<string, any> {
    return Object.entries(this.form).reduce<Record<string, any>>((payload, [key, value]) => {
      payload[key] = typeof value === 'string' ? value.trim() : value
      return payload
    }, {})
  }

  private normalizeLoadedRecord(record: Record<string, any>): Record<string, any> {
    if (this.entity === 'payments') {
      return {
        ...record,
        id: record['id'],
        order_id: record['order_id'] || record['id']
      }
    }

    if (this.entity === 'products') {
      return {
        ...record,
        category_id: record['category_id'] ? String(record['category_id']) : '',
        images: this.normalizeProductImages(record['images']?.length ? record['images'] : [record['url']])
      }
    }

    if ((this.entity === 'promotions' || this.entity === 'users') && 'is_active' in record) {
      return {
        ...record,
        is_active: record['is_active'] === true || record['is_active'] === 'true' ? 'true' : 'false',
        productIds: this.entity === 'promotions'
          ? (record['productIds'] || (Array.isArray(record['products']) ? record['products'].map((product: Product) => product.id) : []))
          : record['productIds'],
        categoryIds: this.entity === 'promotions'
          ? (record['categoryIds'] || [])
          : record['categoryIds']
      }
    }

    return record
  }

  categoryNameForId(id: number | null): string | null {
    if (!id) {
      return null
    }

    return this.categories.find(category => category.id === id)?.name || null
  }

  private normalizedIds(value: unknown): number[] {
    return Array.from(new Set((Array.isArray(value) ? value : [])
      .map(id => Number(id))
      .filter(id => Number.isInteger(id) && id > 0)))
  }

  private normalizeProductImages(value: unknown): string[] {
    return Array.from(new Set((Array.isArray(value) ? value : [])
      .map(image => String(image || '').trim())
      .filter(Boolean)))
      .slice(0, 5)
  }

  private read(): Observable<Record<string, any>> {
    if (this.entity === 'orders' || this.entity === 'payments') {
      return this.adminData.getOrder(this.id)
    }
    if (this.entity === 'users') {
      return this.adminData.getUser(this.id)
    }
    if (this.entity === 'categories') {
      return this.adminData.getCategory(this.id)
    }
    if (this.entity === 'promotions') {
      return this.adminData.getPromotion(this.id)
    }
    return this.adminData.getProduct(this.id)
  }

  private create(payload: Record<string, any>): Observable<unknown> {
    if (this.entity === 'orders') {
      return this.adminData.createOrder(payload)
    }
    if (this.entity === 'users') {
      return this.adminData.createUser(payload)
    }
    if (this.entity === 'categories') {
      return this.adminData.createCategory(payload)
    }
    if (this.entity === 'promotions') {
      return this.adminData.createPromotion(payload)
    }
    return this.adminData.createProduct(payload)
  }

  private update(payload: Record<string, any>): Observable<unknown> {
    if (this.entity === 'orders' || this.entity === 'payments') {
      return this.adminData.updateOrder(this.id, payload)
    }
    if (this.entity === 'users') {
      return this.adminData.updateUser(this.id, payload)
    }
    if (this.entity === 'categories') {
      return this.adminData.updateCategory(this.id, payload)
    }
    if (this.entity === 'promotions') {
      return this.adminData.updatePromotion(this.id, payload)
    }
    return this.adminData.updateProduct(this.id, payload)
  }

  private deleteRecord(): Observable<unknown> {
    if (this.entity === 'orders' || this.entity === 'payments') {
      return this.adminData.deleteOrder(this.id)
    }
    if (this.entity === 'users') {
      return this.adminData.deleteUser(this.id)
    }
    if (this.entity === 'categories') {
      return this.adminData.deleteCategory(this.id)
    }
    if (this.entity === 'promotions') {
      return this.adminData.deletePromotion(this.id)
    }
    return this.adminData.deleteProduct(this.id)
  }

  private extractRecord(response: unknown): { id?: number | string } | null {
    if (!response || typeof response !== 'object') {
      return null
    }

    if ('user' in response && typeof (response as { user?: unknown }).user === 'object') {
      return (response as { user: { id?: number | string } }).user
    }

    return response as { id?: number | string }
  }
}

