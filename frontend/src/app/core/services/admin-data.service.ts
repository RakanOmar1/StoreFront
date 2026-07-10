import { Injectable } from '@angular/core'
import { forkJoin, Observable, of } from 'rxjs'
import { catchError, map, timeout } from 'rxjs/operators'
import { Order } from '../../shared/interfaces/order'
import { Category, Product, Promotion } from '../../shared/interfaces/product'
import { PublicUser } from '../../shared/interfaces/user'
import { ApiUrlService } from './api-url.service'
import { ProductService } from './product.service'

export interface AdminDashboardData {
  products: Product[]
  orders: Order[]
  users: PublicUser[]
  promotions: Promotion[]
}

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  constructor(
    private api: ApiUrlService,
    private products: ProductService
  ) {}

  loadDashboardData(): Observable<AdminDashboardData> {
    return forkJoin({
      products: this.safeList(this.loadProducts()),
      orders: this.safeList(this.loadOrders()),
      users: this.safeList(this.loadUsers()),
      promotions: this.safeList(this.loadPromotions())
    }).pipe(
      map(data => ({
        products: data.products,
        orders: data.orders,
        users: data.users,
        promotions: data.promotions
      }))
    )
  }

  loadProducts(): Observable<Product[]> {
    return this.products.getProducts({ limit: 100, offset: 0 }).pipe(
      map(products => this.asList(products))
    )
  }

  loadOrders(): Observable<Order[]> {
    return this.api.get<Order[] | { value?: Order[] }>('/orders').pipe(
      map(response => this.asList(response).map(order => ({
        ...order,
        total_amount: Number(order.total_amount) || 0
      })))
    )
  }

  loadUsers(): Observable<PublicUser[]> {
    return this.api.get<PublicUser[] | { value?: PublicUser[] }>('/users').pipe(
      map(response => this.asList(response))
    )
  }

  private safeList<T>(source: Observable<T[]>): Observable<T[]> {
    return source.pipe(
      timeout(8000),
      catchError(() => of([]))
    )
  }

  private asList<T>(response: T[] | { value?: T[] } | null | undefined): T[] {
    if (Array.isArray(response)) {
      return response
    }

    if (Array.isArray(response?.value)) {
      return response.value
    }

    return []
  }

  loadCategories(): Observable<Category[]> {
    return this.api.get<Category[] | { value?: Category[] }>('/categories').pipe(
      map(response => this.asList(response))
    )
  }

  loadPromotions(): Observable<Promotion[]> {
    return this.api.get<Promotion[] | { value?: Promotion[] }>('/promotions').pipe(
      map(response => this.asList(response))
    )
  }

  getPromotion(id: number | string): Observable<Promotion> {
    return this.api.get<Promotion>(`/promotions/${id}`)
  }

  createPromotion(payload: Partial<Promotion>): Observable<Promotion> {
    return this.api.post<Promotion>('/promotions', payload)
  }

  updatePromotion(id: number | string, payload: Partial<Promotion>): Observable<Promotion> {
    return this.api.put<Promotion>(`/promotions/${id}`, payload)
  }

  deletePromotion(id: number | string): Observable<Promotion> {
    return this.api.delete<Promotion>(`/promotions/${id}`)
  }

  getCategory(id: number | string): Observable<Category> {
    return this.api.get<Category>(`/categories/${id}`)
  }

  createCategory(payload: Partial<Category>): Observable<Category> {
    return this.api.post<Category>('/categories', payload)
  }

  updateCategory(id: number | string, payload: Partial<Category>): Observable<Category> {
    return this.api.put<Category>(`/categories/${id}`, payload)
  }

  deleteCategory(id: number | string): Observable<Category> {
    return this.api.delete<Category>(`/categories/${id}`)
  }

  getProduct(id: number | string): Observable<Product> {
    return this.products.getProduct(id)
  }

  createProduct(payload: Partial<Product>): Observable<Product> {
    return this.api.post<Product>('/products', payload)
  }

  updateProduct(id: number | string, payload: Partial<Product>): Observable<Product> {
    return this.api.put<Product>(`/products/${id}`, payload)
  }

  deleteProduct(id: number | string): Observable<Product> {
    return this.api.delete<Product>(`/products/${id}`)
  }

  getOrder(id: number | string): Observable<Order> {
    return this.api.get<Order>(`/orders/${id}`).pipe(
      map(order => ({ ...order, total_amount: Number(order.total_amount) || 0 }))
    )
  }

  createOrder(payload: Partial<Order>): Observable<Order> {
    return this.api.post<Order>('/orders', payload)
  }

  updateOrder(id: number | string, payload: Partial<Order>): Observable<Order> {
    return this.api.put<Order>(`/orders/${id}`, payload)
  }

  deleteOrder(id: number | string): Observable<Order> {
    return this.api.delete<Order>(`/orders/${id}`)
  }

  getUser(id: number | string): Observable<PublicUser> {
    return this.api.get<PublicUser>(`/users/${id}`)
  }

  createUser(payload: Partial<PublicUser> & { password?: string }): Observable<PublicUser> {
    return this.api.post<{ user: PublicUser } | PublicUser>('/users', payload).pipe(
      map(response => 'user' in response ? response.user : response)
    )
  }

  updateUser(id: number | string, payload: Partial<PublicUser> & { password?: string }): Observable<PublicUser> {
    return this.api.put<PublicUser>(`/users/${id}`, payload)
  }

  deleteUser(id: number | string): Observable<PublicUser> {
    return this.api.delete<PublicUser>(`/users/${id}`)
  }
}
