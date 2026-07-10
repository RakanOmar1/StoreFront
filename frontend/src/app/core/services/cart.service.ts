import { Injectable } from '@angular/core'
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs'
import { catchError, map, tap } from 'rxjs/operators'
import { Cart, CartItem } from '../../shared/interfaces/cart-item'
import { Product } from '../../shared/interfaces/product'
import { ApiUrlService } from './api-url.service'
import { environment } from '../../../environments/environment'

@Injectable({ providedIn: 'root' })
export class CartService {
  private storageKey = 'cart'
  private tokenKey = 'token'
  private backendSynced = false
  private backendCartAvailable = environment.apiCapabilities.cart
  private items: CartItem[] = this.loadCart()
  private items$ = new BehaviorSubject<CartItem[]>([...this.items])

  cart$ = this.items$.asObservable()

  constructor(private api: ApiUrlService) {}

  loadBackendCart(): Observable<CartItem[]> {
    if (!this.backendCartAvailable) {
      return of(this.getItems())
    }

    return this.api.get<Cart>('/cart').pipe(
      map(cart => cart.items || []),
      tap(items => {
        this.items = items.map(item => ({
          ...item,
          product: {
            ...item.product,
            price: Number(item.product.price) || 0,
            finalPrice: item.product.finalPrice ?? item.product.price
          }
        }))
        this.backendSynced = true
        this.emit()
      }),
      catchError(error => {
        if (error?.status === 404) {
          this.backendCartAvailable = false
        }

        return of(this.getItems())
      })
    )
  }

  addToCart(product: Product, quantity = 1) {
    const productId = product.id
    const amount = Math.max(1, Number(quantity) || 1)

    if (!productId) {
      return
    }

    const idx = this.items.findIndex(i => i.product.id === product.id)
    if (idx > -1) {
      this.items[idx].quantity += amount
    } else {
      this.items.push({ product, quantity: amount })
    }
    this.emit()

    if (this.hasToken() && this.backendCartAvailable) {
      this.api.post('/cart/add', { productId, quantity: amount }).pipe(
        catchError(error => {
          if (error?.status === 404) {
            this.backendCartAvailable = false
          }
          this.backendSynced = false
          return of(null)
        })
      ).subscribe()
    } else {
      this.backendSynced = false
    }
  }

  updateQuantity(productId: number, quantity: number) {
    const amount = Number(quantity)

    if (amount <= 0) {
      this.removeItem(productId)
      return
    }

    this.items = this.items.map(i => i.product.id === productId ? { ...i, quantity: amount } : i)
    this.emit()

    if (this.hasToken() && this.backendCartAvailable) {
      this.api.patch('/cart/update', { productId, quantity: amount }).pipe(
        catchError(error => {
          if (error?.status === 404) {
            this.backendCartAvailable = false
          }
          this.backendSynced = false
          return of(null)
        })
      ).subscribe()
    } else {
      this.backendSynced = false
    }
  }

  removeItem(productId: number) {
    this.items = this.items.filter(i => i.product.id !== productId)
    this.emit()

    if (this.hasToken() && this.backendCartAvailable) {
      this.api.delete(`/cart/remove/${productId}`).pipe(
        catchError(error => {
          if (error?.status === 404) {
            this.backendCartAvailable = false
          }
          this.backendSynced = false
          return of(null)
        })
      ).subscribe()
    } else {
      this.backendSynced = false
    }
  }

  clear() {
    this.items = []
    this.emit()
  }

  getItems(): CartItem[] {
    return [...this.items]
  }

  subtotal(): number {
    return this.items.reduce((s, i) => s + this.unitPrice(i.product) * i.quantity, 0)
  }

  originalSubtotal(): number {
    return this.items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  }

  promotionSavings(): number {
    return Math.max(0, this.originalSubtotal() - this.subtotal())
  }

  itemCount(): number {
    return this.items.reduce((s, i) => s + i.quantity, 0)
  }

  private emit() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.items))
    this.items$.next([...this.items])
  }

  private loadCart(): CartItem[] {
    const value = localStorage.getItem(this.storageKey)

    if (!value) {
      return []
    }

    try {
      return JSON.parse(value)
    } catch {
      localStorage.removeItem(this.storageKey)
      return []
    }
  }

  syncToBackend(): Observable<unknown> {
    if (this.items.length === 0 || !this.backendCartAvailable) {
      return of([])
    }

    if (this.backendSynced) {
      return of([])
    }

    return forkJoin(this.items.map(item => this.api.post('/cart/add', {
      productId: item.product.id,
      quantity: item.quantity
    }).pipe(catchError(error => {
      if (error?.status === 404) {
        this.backendCartAvailable = false
      }

      return of(null)
    })))).pipe(
      tap(() => {
        this.backendSynced = true
      })
    )
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey)
  }

  private unitPrice(product: { price: number; finalPrice?: number }): number {
    return Number(product.finalPrice ?? product.price)
  }
}
