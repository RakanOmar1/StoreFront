import { CommonModule } from '@angular/common'
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core'
import { Router, RouterModule, ActivatedRoute } from '@angular/router'
import { ColDef } from 'ag-grid-community'
import { Observable, Subscription } from 'rxjs'
import { switchMap, timeout } from 'rxjs/operators'
import { AdminDataService } from '../../core/services/admin-data.service'
import { Order } from '../../shared/interfaces/order'
import { Category, Product, Promotion } from '../../shared/interfaces/product'
import { PublicUser } from '../../shared/interfaces/user'
import { AdminConfirmationDialogComponent } from './admin-confirmation-dialog.component'
import { AdminDataTableComponent } from './admin-data-table.component'
import { AdminSidebarComponent } from './admin-sidebar.component'
import { AdminStateBlockComponent } from './admin-ui.component'

type AdminTableType = 'products' | 'categories' | 'promotions' | 'orders' | 'payments' | 'users'

@Component({
  selector: 'app-admin-table-page',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminDataTableComponent, AdminSidebarComponent, AdminConfirmationDialogComponent, AdminStateBlockComponent],
  template: `
    <section class="admin-shell">
      <app-admin-sidebar />

      <div class="admin-shell-content">
        <section class="admin-page admin-table-page">
          <app-admin-state-block *ngIf="error" title="Could not load table" [message]="error" tone="error" />
          <app-admin-state-block *ngIf="loading" [title]="'Loading ' + (pageTitle | lowercase)" message="Preparing rows, filters, and actions." [loading]="true" />

          <app-admin-data-table
            *ngIf="!loading && tableType === 'products'"
            eyebrow="Products"
            title="All products"
            filterLabel="Category"
            filterField="category"
            searchPlaceholder="Search products..."
            createLink="/admin/products/new"
            dashboardLink="/admin"
            storeLink="/products"
            [filterOptions]="productCategories"
            [rows]="productRows"
            [columns]="productColumns"
            (refresh)="loadTableData()"
            (rowView)="viewRow($event)"
          />

          <app-admin-data-table
            *ngIf="!loading && tableType === 'categories'"
            eyebrow="Categories"
            title="Product categories"
            filterLabel="Status"
            filterField=""
            searchPlaceholder="Search categories..."
            createLink="/admin/categories/new"
            dashboardLink="/admin"
            storeLink="/products"
            [filterOptions]="[]"
            [rows]="categoryRows"
            [columns]="categoryColumns"
            (refresh)="loadTableData()"
            (rowView)="viewRow($event)"
          />

          <app-admin-data-table
            *ngIf="!loading && tableType === 'promotions'"
            eyebrow="Promotions"
            title="Promotion campaigns"
            filterLabel="Status"
            filterField="status"
            searchPlaceholder="Search promotions..."
            createLink="/admin/promotions/new"
            dashboardLink="/admin"
            storeLink="/products"
            [filterOptions]="promotionStatuses"
            [rows]="promotionRows"
            [columns]="promotionColumns"
            (refresh)="loadTableData()"
            (rowView)="viewRow($event)"
          />

          <app-admin-data-table
            *ngIf="!loading && tableType === 'orders'"
            eyebrow="Orders"
            title="Order list"
            filterLabel="Status"
            filterField="status"
            searchPlaceholder="Search orders..."
            createLink="/admin/orders/new"
            dashboardLink="/admin"
            storeLink="/products"
            [filterOptions]="orderStatuses"
            [rows]="orderRows"
            [columns]="orderColumns"
            (refresh)="loadTableData()"
            (rowView)="viewRow($event)"
          />

          <ng-container *ngIf="!loading && tableType === 'payments'">
            <section class="payment-report-grid" aria-label="Payment reports">
              <article class="payment-report-card payment-report-card--paid">
                <span>Collected</span>
                <strong>{{ money(paidPaymentsTotal) }}</strong>
                <p>{{ paidPaymentsCount }} paid payments.</p>
              </article>
              <article class="payment-report-card payment-report-card--pending">
                <span>Pending</span>
                <strong>{{ money(pendingPaymentsTotal) }}</strong>
                <p>{{ pendingPaymentsCount }} waiting for confirmation.</p>
              </article>
              <article class="payment-report-card payment-report-card--failed">
                <span>Failed</span>
                <strong>{{ failedPaymentsCount }}</strong>
                <p>Payments that need review.</p>
              </article>
              <article class="payment-report-card payment-report-card--refunded">
                <span>Refunded</span>
                <strong>{{ money(refundedPaymentsTotal) }}</strong>
                <p>{{ refundedPaymentsCount }} refunded payments.</p>
              </article>
            </section>

            <app-admin-data-table
              eyebrow="Payments"
              title="Payment ledger"
              filterLabel="Status"
              filterField="payment_status"
              searchPlaceholder="Search payments..."
              dashboardLink="/admin"
              storeLink="/products"
              [filterOptions]="paymentStatuses"
              [rows]="paymentRows"
              [columns]="paymentColumns"
              (refresh)="loadTableData()"
              (rowView)="viewRow($event)"
            />
          </ng-container>

          <app-admin-data-table
            *ngIf="!loading && tableType === 'users'"
            eyebrow="Users"
            title="User accounts"
            filterLabel="Role"
            filterField="role"
            searchPlaceholder="Search users..."
            createLink="/admin/users/new"
            dashboardLink="/admin"
            storeLink="/products"
            [filterOptions]="userRoles"
            [rows]="userRows"
            [columns]="userColumns"
            (refresh)="loadTableData()"
            (rowView)="viewRow($event)"
          />

          <app-admin-confirmation-dialog
            *ngIf="deleteDialogOpen"
            [title]="deleteTitle"
            [message]="deleteMessage"
            [confirmLabel]="deleteLabel"
            [loading]="deleting"
            [error]="deleteError"
            (cancel)="closeDeleteDialog()"
            (confirm)="confirmDelete()"
          />
        </section>
      </div>
    </section>
  `
})
export class AdminTablePageComponent implements OnInit, OnDestroy {
  error = ''
  loading = true
  tableType: AdminTableType = 'products'
  orders: Order[] = []
  products: Product[] = []
  categories: Category[] = []
  promotions: Promotion[] = []
  users: PublicUser[] = []
  deleteDialogOpen = false
  deleting = false
  deleteError = ''
  selectedDeleteId: number | string | null = null
  selectedDeleteEntity: AdminTableType | null = null
  selectedDeleteAction: 'delete' | 'cancel' = 'delete'
  private routeSub?: Subscription
  private dataSub?: Subscription
  private loadRequestId = 0
  private readonly tableLoadTimeoutMs = 10000

  productColumns: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 90, flex: 0 },
    { field: 'name', headerName: 'Product' },
    { field: 'category', headerName: 'Category' },
    { field: 'price', headerName: 'Price' },
    { field: 'finalPrice', headerName: 'Final price' },
    { field: 'promotion', headerName: 'Promotion' },
    { field: 'created_at', headerName: 'Created' },
    this.actionColumn('products')
  ]

  categoryColumns: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 90, flex: 0 },
    { field: 'name', headerName: 'Category' },
    { field: 'description', headerName: 'Description' },
    { field: 'created_at', headerName: 'Created' },
    this.actionColumn('categories')
  ]

  promotionColumns: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 90, flex: 0 },
    { field: 'name', headerName: 'Promotion' },
    { field: 'type', headerName: 'Type' },
    { field: 'value', headerName: 'Value' },
    { field: 'status', headerName: 'Status' },
    this.actionColumn('promotions')
  ]

  orderColumns: ColDef[] = [
    { field: 'id', headerName: 'Order ID', width: 110, flex: 0 },
    { field: 'user_id', headerName: 'User ID' },
    { field: 'status', headerName: 'Status' },
    { field: 'payment_status', headerName: 'Payment' },
    { field: 'payment_method', headerName: 'Method' },
    { field: 'delivery_type', headerName: 'Delivery' },
    { field: 'total_amount', headerName: 'Total' },
    { field: 'created_at', headerName: 'Created' },
    this.actionColumn('orders', false, true)
  ]

  paymentColumns: ColDef[] = [
    { field: 'id', headerName: 'Payment ID', width: 120, flex: 0 },
    { field: 'order_id', headerName: 'Order ID', width: 110, flex: 0 },
    { field: 'user_id', headerName: 'User ID' },
    { field: 'payment_status', headerName: 'Status' },
    { field: 'payment_method', headerName: 'Method' },
    { field: 'total_amount', headerName: 'Amount' },
    { field: 'order_status', headerName: 'Order status' },
    { field: 'created_at', headerName: 'Created' },
    this.actionColumn('payments', false, true)
  ]

  userColumns: ColDef[] = [
    { field: 'id', headerName: 'User ID', width: 110, flex: 0 },
    { field: 'displayName', headerName: 'Name' },
    { field: 'email', headerName: 'Email' },
    { field: 'phone', headerName: 'Phone' },
    { field: 'role', headerName: 'Role' },
    { field: 'status', headerName: 'Status' },
    { field: 'city', headerName: 'City' },
    { field: 'created_at', headerName: 'Created' },
    this.actionColumn('users')
  ]

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminData: AdminDataService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.routeSub = this.route.data.subscribe(data => {
      this.tableType = (data['tableType'] || 'products') as AdminTableType
      this.loadTableData()
    })
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe()
    this.dataSub?.unsubscribe()
  }

  loadTableData() {
    this.dataSub?.unsubscribe()
    const requestId = ++this.loadRequestId
    this.error = ''
    this.loading = true
    this.orders = []
    this.products = []
    this.categories = []
    this.promotions = []
    this.users = []

    if (this.tableType === 'categories') {
      this.loadList(this.adminData.loadCategories(), requestId, categories => {
        this.categories = categories
      })
      return
    }

    if (this.tableType === 'orders' || this.tableType === 'payments') {
      this.loadList(this.adminData.loadOrders(), requestId, orders => {
        this.orders = orders
      })
      return
    }

    if (this.tableType === 'promotions') {
      this.loadList(this.adminData.loadPromotions(), requestId, promotions => {
        this.promotions = promotions
      })
      return
    }

    if (this.tableType === 'users') {
      this.loadList(this.adminData.loadUsers(), requestId, users => {
        this.users = users
      })
      return
    }

    this.loadList(this.adminData.loadProducts(), requestId, products => {
      this.products = products
    })
  }

  private loadList<T>(source: Observable<T[]>, requestId: number, assign: (items: T[]) => void) {
    this.dataSub = source.pipe(
      timeout(this.tableLoadTimeoutMs)
    ).subscribe({
      next: items => {
        if (requestId !== this.loadRequestId) {
          return
        }

        assign(items)
        this.loading = false
      },
      error: () => {
        if (requestId !== this.loadRequestId) {
          return
        }

        this.handleLoadError()
      }
    })
  }

  private handleLoadError() {
    this.error = `Could not load ${this.pageTitle.toLowerCase()} data.`
    this.loading = false
  }

  get deleteTitle(): string {
    if (this.selectedDeleteAction === 'cancel') {
      return `Cancel ${this.selectedEntityLabel.toLowerCase()}?`
    }

    return `Delete ${this.selectedEntityLabel.toLowerCase()}?`
  }

  get deleteLabel(): string {
    if (this.selectedDeleteAction === 'cancel') {
      return `Cancel ${this.selectedEntityLabel.toLowerCase()}`
    }

    return `Delete ${this.selectedEntityLabel.toLowerCase()}`
  }

  get deleteMessage(): string {
    if (this.selectedDeleteAction === 'cancel') {
      if (this.selectedDeleteEntity === 'orders') {
        return 'This keeps the order in the database and changes its status to CANCELLED.'
      }
      if (this.selectedDeleteEntity === 'payments') {
        return 'This keeps the payment record in the database and marks the payment as FAILED.'
      }
    }

    if (this.selectedDeleteEntity === 'categories') {
      return 'This category may contain products. The backend will block deletion while products are assigned to it.'
    }
    if (this.selectedDeleteEntity === 'orders') {
      return 'This removes the order record and its related order items. This action cannot be undone.'
    }
    if (this.selectedDeleteEntity === 'payments') {
      return 'Payments are stored on orders. Use the payment edit screen to change status instead of deleting the payment record.'
    }
    if (this.selectedDeleteEntity === 'users') {
      return 'This removes the user account. Confirm this account is not needed for admin access.'
    }
    if (this.selectedDeleteEntity === 'promotions') {
      return 'This removes the promotion record. Products using it may lose their promotion reference.'
    }
    return 'This action permanently deletes the product and cannot be undone.'
  }

  private get selectedEntityLabel(): string {
    if (this.selectedDeleteEntity === 'categories') {
      return 'Category'
    }
    if (this.selectedDeleteEntity === 'orders' || this.selectedDeleteEntity === 'payments') {
      return this.selectedDeleteEntity === 'payments' ? 'Payment' : 'Order'
    }
    if (this.selectedDeleteEntity === 'users') {
      return 'User'
    }
    if (this.selectedDeleteEntity === 'promotions') {
      return 'Promotion'
    }
    return 'Product'
  }

  openDeleteDialog(entity: AdminTableType, id: number | string) {
    this.selectedDeleteEntity = entity
    this.selectedDeleteId = id
    this.selectedDeleteAction = 'delete'
    this.deleteError = ''
    this.deleteDialogOpen = true
  }

  openCancelDialog(entity: AdminTableType, id: number | string) {
    this.selectedDeleteEntity = entity
    this.selectedDeleteId = id
    this.selectedDeleteAction = 'cancel'
    this.deleteError = ''
    this.deleteDialogOpen = true
  }

  closeDeleteDialog() {
    if (this.deleting) {
      return
    }
    this.deleteDialogOpen = false
    this.deleteError = ''
    this.selectedDeleteEntity = null
    this.selectedDeleteId = null
    this.selectedDeleteAction = 'delete'
  }

  viewRow(row: Record<string, unknown>) {
    const id = row['id']
    if (!id) {
      return
    }

    this.router.navigateByUrl(`/admin/${this.tableType}/${id}`)
  }

  confirmDelete() {
    if (this.deleting || !this.selectedDeleteEntity || !this.selectedDeleteId) {
      return
    }

    this.deleting = true
    this.deleteError = ''

    const request = this.selectedDeleteAction === 'cancel'
      ? this.cancelRequest(this.selectedDeleteEntity, this.selectedDeleteId)
      : this.deleteRequest(this.selectedDeleteEntity, this.selectedDeleteId)

    request.subscribe({
      next: () => {
        this.deleting = false
        this.closeDeleteDialog()
        this.loadTableData()
      },
      error: () => {
        this.deleting = false
        this.deleteError = `Could not ${this.selectedDeleteAction} ${this.selectedEntityLabel.toLowerCase()}.`
      }
    })
  }

  private deleteRequest(entity: AdminTableType, id: number | string): Observable<unknown> {
    if (entity === 'categories') {
      return this.adminData.deleteCategory(id)
    }
    if (entity === 'orders') {
      return this.adminData.deleteOrder(id)
    }
    if (entity === 'payments') {
      return this.adminData.deleteOrder(id)
    }
    if (entity === 'users') {
      return this.adminData.deleteUser(id)
    }
    if (entity === 'promotions') {
      return this.adminData.deletePromotion(id)
    }
    return this.adminData.deleteProduct(id)
  }

  private cancelRequest(entity: AdminTableType, id: number | string): Observable<unknown> {
    const order = this.orders.find(item => Number(item.id) === Number(id))
    if (!order) {
      return this.adminData.getOrder(id).pipe(
        switchMap(savedOrder => this.updateCancelledRecord(entity, id, savedOrder))
      )
    }

    return this.updateCancelledRecord(entity, id, order)
  }

  private updateCancelledRecord(entity: AdminTableType, id: number | string, order: Order): Observable<unknown> {
    if (entity === 'payments') {
      return this.adminData.updateOrder(id, {
        ...order,
        payment_status: 'FAILED'
      })
    }

    return this.adminData.updateOrder(id, {
      ...order,
      status: 'CANCELLED'
    })
  }

  get pageTitle(): string {
    if (this.tableType === 'orders') {
      return 'Orders'
    }
    if (this.tableType === 'payments') {
      return 'Payments'
    }
    if (this.tableType === 'categories') {
      return 'Categories'
    }
    if (this.tableType === 'users') {
      return 'Users'
    }
    if (this.tableType === 'promotions') {
      return 'Promotions'
    }

    return 'Products'
  }

  get pageDescription(): string {
    if (this.tableType === 'orders') {
      return 'Review every order with search and status filters.'
    }
    if (this.tableType === 'payments') {
      return 'Review payment status, methods, totals, and collection reports.'
    }
    if (this.tableType === 'categories') {
      return 'Manage product categories.'
    }
    if (this.tableType === 'users') {
      return 'Review user accounts with search and role filters.'
    }
    if (this.tableType === 'promotions') {
      return 'Manage discounts, fixed offers, and active campaign status.'
    }

    return 'Review every product with search and category filters.'
  }

  get productCategories(): string[] {
    return this.unique(this.products.map(product => product.category || 'Uncategorized'))
  }

  get orderStatuses(): string[] {
    return this.unique(this.orders.map(order => order.status || 'PENDING'))
  }

  get paymentStatuses(): string[] {
    return this.unique(this.orders.map(order => order.payment_status || 'PENDING'))
  }

  get categoryRows(): Record<string, unknown>[] {
    return this.categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description || 'None',
      created_at: this.date(category.created_at)
    }))
  }

  get userRoles(): string[] {
    return this.unique(this.users.map(user => user.role || 'CUSTOMER'))
  }

  get promotionStatuses(): string[] {
    return ['Active', 'Inactive']
  }

  get productRows(): Record<string, unknown>[] {
    return this.products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category || 'Uncategorized',
      price: this.money(product.price),
      finalPrice: this.money(product.finalPrice ?? product.price),
      promotion: product.promotion?.name || 'None',
      created_at: this.date(product.created_at)
    }))
  }

  get orderRows(): Record<string, unknown>[] {
    return this.orders.map(order => ({
      id: order.id,
      user_id: order.user_id,
      status: order.status,
      payment_status: order.payment_status || 'PENDING',
      payment_method: order.payment_method || 'CASH',
      delivery_type: order.delivery_type || 'PICKUP',
      total_amount: this.money(order.total_amount || 0),
      created_at: this.date(order.created_at)
    }))
  }

  get paymentRows(): Record<string, unknown>[] {
    return this.orders.map(order => ({
      id: order.id,
      order_id: order.id,
      user_id: order.user_id,
      payment_status: order.payment_status || 'PENDING',
      payment_method: order.payment_method || 'CASH',
      total_amount: this.money(order.total_amount || 0),
      order_status: order.status || 'PENDING',
      created_at: this.date(order.created_at)
    }))
  }

  get paidPaymentsCount(): number {
    return this.orders.filter(order => (order.payment_status || 'PENDING') === 'PAID').length
  }

  get paidPaymentsTotal(): number {
    return this.sumPaymentsByStatus('PAID')
  }

  get pendingPaymentsCount(): number {
    return this.orders.filter(order => (order.payment_status || 'PENDING') === 'PENDING').length
  }

  get pendingPaymentsTotal(): number {
    return this.sumPaymentsByStatus('PENDING')
  }

  get failedPaymentsCount(): number {
    return this.orders.filter(order => (order.payment_status || 'PENDING') === 'FAILED').length
  }

  get refundedPaymentsCount(): number {
    return this.orders.filter(order => (order.payment_status || 'PENDING') === 'REFUNDED').length
  }

  get refundedPaymentsTotal(): number {
    return this.sumPaymentsByStatus('REFUNDED')
  }

  get promotionRows(): Record<string, unknown>[] {
    return this.promotions.map(promotion => ({
      id: promotion.id,
      name: promotion.name,
      type: promotion.type,
      value: promotion.type === 'PERCENT' ? `${promotion.value}%` : this.money(promotion.value),
      status: promotion.is_active === false ? 'Inactive' : 'Active'
    }))
  }

  get userRows(): Record<string, unknown>[] {
    return this.users.map(user => ({
      id: user.id,
      displayName: user.name || [user.firstname, user.lastname].filter(Boolean).join(' '),
      email: user.email || 'None',
      phone: user.phone || 'None',
      role: user.role || 'CUSTOMER',
      status: user.is_active === false ? 'Inactive' : 'Active',
      city: user.city || 'None',
      created_at: this.date(user.created_at)
    }))
  }

  money(value: number): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value || 0))
  }

  private date(value?: string): string {
    return value ? new Date(value).toLocaleDateString() : 'None'
  }

  private unique(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b))
  }

  private sumPaymentsByStatus(status: string): number {
    return this.orders
      .filter(order => (order.payment_status || 'PENDING') === status)
      .reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0)
  }

  private actionColumn(entity: AdminTableType, allowDelete = true, allowCancel = false): ColDef {
    return {
      field: 'actions',
      headerName: 'Actions',
      filter: false,
      sortable: false,
      minWidth: allowDelete || allowCancel ? 132 : 96,
      maxWidth: allowDelete || allowCancel ? 150 : 112,
      flex: 0,
      cellRenderer: (params: { data?: { id?: number | string } }) => {
        const id = params.data?.id
        if (!id) {
          return ''
        }

        const wrapper = document.createElement('div')
        wrapper.className = 'admin-row-actions'

        const runAction = (action: 'view' | 'edit' | 'delete' | 'cancel') => {
          this.ngZone.run(() => {
            if (action === 'delete') {
              this.openDeleteDialog(entity, id)
              return
            }
            if (action === 'cancel') {
              this.openCancelDialog(entity, id)
              return
            }

            const suffix = action === 'view' ? '' : `/${action}`
            this.router.navigateByUrl(`/admin/${entity}/${id}${suffix}`)
          })
        }

        const actions: Array<{ action: 'view' | 'edit' | 'delete' | 'cancel'; label: string; icon: string; danger?: boolean }> = [
          { action: 'view', label: 'View', icon: 'pi pi-eye' },
          { action: 'edit', label: 'Edit', icon: 'pi pi-pencil' }
        ]

        if (allowCancel) {
          actions.push({ action: 'cancel', label: 'Cancel', icon: 'pi pi-ban', danger: true })
        }

        if (allowDelete) {
          actions.push({ action: 'delete', label: 'Delete', icon: 'pi pi-trash', danger: true })
        }

        actions.forEach(item => {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = item.danger ? 'danger' : ''
          button.setAttribute('aria-label', item.label)
          button.setAttribute('title', item.label)

          const icon = document.createElement('i')
          icon.className = item.icon
          icon.setAttribute('aria-hidden', 'true')
          button.appendChild(icon)

          button.addEventListener('click', event => {
            event.preventDefault()
            event.stopPropagation()
            runAction(item.action)
          })
          wrapper.appendChild(button)
        })

        return wrapper
      }
    }
  }
}
