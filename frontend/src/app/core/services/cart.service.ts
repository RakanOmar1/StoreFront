import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { CartItem } from '../../shared/interfaces/cart-item'
import { Product } from '../../shared/interfaces/product'

@Injectable({ providedIn: 'root' })
export class CartService {
  private storageKey = 'cart'
  private items: CartItem[] = this.loadCart()
  private items$ = new BehaviorSubject<CartItem[]>([...this.items])

  cart$ = this.items$.asObservable()

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
  }

  updateQuantity(productId: number, quantity: number) {
    const amount = Number(quantity)

    if (amount <= 0) {
      this.removeItem(productId)
      return
    }

    this.items = this.items.map(i => i.product.id === productId ? { ...i, quantity: amount } : i)
    this.emit()
  }

  removeItem(productId: number) {
    this.items = this.items.filter(i => i.product.id !== productId)
    this.emit()
  }

  clear() {
    this.items = []
    this.emit()
  }

  getItems(): CartItem[] {
    return [...this.items]
  }

  subtotal(): number {
    return this.items.reduce((s, i) => s + i.product.price * i.quantity, 0)
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
}
