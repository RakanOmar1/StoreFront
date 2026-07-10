import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, Output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import { ColDef } from 'ag-grid-community'
import { MenuItem } from 'primeng/api'
import { ButtonModule } from 'primeng/button'
import { DropdownModule } from 'primeng/dropdown'
import { MenuModule } from 'primeng/menu'
import { SelectOption } from '../../shared/interfaces/select-option'
import { TranslatePipe } from '../../core/i18n/translate.pipe'
import { TranslationService } from '../../core/i18n/translation.service'

@Component({
  selector: 'app-admin-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AgGridAngular, DropdownModule, MenuModule, ButtonModule, TranslatePipe],
  template: `
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div class="admin-table-title">
          <p class="eyebrow">{{ eyebrow }}</p>
          <h2>{{ title }}</h2>
          <span>{{ filteredRows.length }} of {{ rows.length }} records</span>
        </div>

        <div class="admin-table-controls">
          <label class="admin-search-field">
            <span>{{ 'common.search' | t }}</span>
            <div>
              <i class="pi pi-search" aria-hidden="true"></i>
              <input type="search" [(ngModel)]="searchTerm" [placeholder]="searchPlaceholder" aria-label="Search records" />
              <button *ngIf="searchTerm" type="button" aria-label="Clear search" (click)="searchTerm = ''">
                <i class="pi pi-times" aria-hidden="true"></i>
              </button>
            </div>
          </label>

          <label *ngIf="filterOptions.length">
            <span>{{ filterLabel }}</span>
            <p-dropdown
              [(ngModel)]="selectedFilter"
              [options]="filterSelectOptions"
              optionLabel="label"
              optionValue="value"
              [placeholder]="filterLabel"
              appendTo="body"
              styleClass="app-dropdown"
            />
          </label>

          <label class="admin-page-size-control">
            <span>Page size</span>
            <select [(ngModel)]="pageSize" aria-label="Page size">
              <option *ngFor="let option of pageSizeOptions" [ngValue]="option">{{ option }}</option>
            </select>
          </label>

          <div class="admin-table-actions">
            <button *ngIf="createLink" type="button" class="admin-create-link" (click)="goTo(createLink)">
              <i class="pi pi-plus" aria-hidden="true"></i>{{ 'common.create' | t }}
            </button>
            <p-menu #tableMenu [model]="tableMenuItems" [popup]="true" appendTo="body" styleClass="admin-table-menu" />
            <p-button
              type="button"
              icon="pi pi-ellipsis-v"
              styleClass="admin-options-button"
              ariaLabel="Table options"
              (onClick)="tableMenu.toggle($event)"
            />
          </div>
        </div>
      </div>

      <ag-grid-angular
        *ngIf="filteredRows.length; else emptyTable"
        class="ag-theme-quartz admin-grid-table"
        [rowData]="filteredRows"
        [columnDefs]="columns"
        [defaultColDef]="defaultColDef"
        [pagination]="true"
        [paginationPageSize]="pageSize"
        [paginationPageSizeSelector]="false"
        [rowHeight]="52"
        [headerHeight]="46"
        (rowDoubleClicked)="openRow($event.data)"
      />
      <ng-template #emptyTable>
        <section class="admin-empty-state">
          <i class="pi pi-inbox" aria-hidden="true"></i>
          <strong>No matching records</strong>
          <p>Clear search or filters to see more results.</p>
          <button type="button" class="secondary-button" (click)="clearFilters()">Reset view</button>
        </section>
      </ng-template>
    </section>
  `
})
export class AdminDataTableComponent {
  @Input() eyebrow = 'Admin table'
  @Input() title = 'Table'
  @Input() rows: Record<string, unknown>[] = []
  @Input() columns: ColDef[] = []
  @Input() filterLabel = 'Filter'
  @Input() filterField = ''
  @Input() filterOptions: string[] = []
  @Input() searchPlaceholder = 'Search records...'
  @Input() createLink = ''
  @Input() dashboardLink = ''
  @Input() storeLink = ''
  @Output() refresh = new EventEmitter<void>()
  @Output() rowView = new EventEmitter<Record<string, unknown>>()

  searchTerm = ''
  selectedFilter = 'all'
  pageSize = 10
  pageSizeOptions = [10, 25, 50]

  constructor(private router: Router, private i18n: TranslationService) {}

  defaultColDef: ColDef = {
    filter: true,
    resizable: true,
    sortable: true,
    flex: 1,
    minWidth: 130
  }

  get filteredRows(): Record<string, unknown>[] {
    const term = this.searchTerm.trim().toLowerCase()

    return this.rows.filter(row => {
      const matchesFilter = this.selectedFilter === 'all'
        || !this.filterField
        || String(row[this.filterField] ?? '').toLowerCase() === this.selectedFilter.toLowerCase()

      if (!matchesFilter) {
        return false
      }

      if (!term) {
        return true
      }

      return Object.values(row).some(value => String(value ?? '').toLowerCase().includes(term))
    })
  }

  get filterSelectOptions(): SelectOption<string>[] {
    return [
      { value: 'all', label: this.i18n.translate('common.all') },
      ...this.filterOptions.map(option => ({ value: option, label: option }))
    ]
  }

  get tableMenuItems(): MenuItem[] {
    return [
      {
        label: this.i18n.translate('common.dashboard'),
        icon: 'pi pi-th-large',
        visible: Boolean(this.dashboardLink),
        command: () => this.goTo(this.dashboardLink)
      },
      {
        label: this.i18n.translate('common.viewStore'),
        icon: 'pi pi-external-link',
        visible: Boolean(this.storeLink),
        command: () => this.goTo(this.storeLink)
      },
      {
        label: this.i18n.translate('common.refresh'),
        icon: 'pi pi-refresh',
        command: () => this.refresh.emit()
      },
      {
        label: this.i18n.translate('common.export'),
        icon: 'pi pi-upload',
        command: () => this.exportCsv()
      }
    ]
  }

  goTo(link: string) {
    this.router.navigateByUrl(link)
  }

  clearFilters() {
    this.searchTerm = ''
    this.selectedFilter = 'all'
  }

  openRow(row: Record<string, unknown> | undefined) {
    if (!row?.['id']) {
      return
    }

    this.rowView.emit(row)
  }

  private exportCsv() {
    const exportColumns = this.columns.filter(column => column.field && column.field !== 'actions')
    const headers = exportColumns.map(column => column.headerName || column.field || '')
    const rows = this.filteredRows.map(row =>
      exportColumns.map(column => this.csvCell(row[column.field as string])).join(',')
    )
    const csv = [headers.map(header => this.csvCell(header)).join(','), ...rows].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'admin-table'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  private csvCell(value: unknown): string {
    const text = String(value ?? '')
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
}
