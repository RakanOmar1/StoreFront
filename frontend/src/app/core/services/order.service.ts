import { Injectable } from '@angular/core'
import { Observable, forkJoin, throwError } from 'rxjs'
import { catchError, map, switchMap } from 'rxjs/operators'
import { CheckoutPayload, CheckoutResponse, Order, OrderItem } from '../../shared/interfaces/order'
import { CartItem } from '../../shared/interfaces/cart-item'
import { ApiUrlService } from './api-url.service'
import { environment } from '../../../environments/environment'

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private api: ApiUrlService) {}

  createOrder(order: Order): Observable<Order> {
    return this.api.post<Order>('/orders', order)
  }

  addProduct(orderId: number | string, productId: number | string, quantity: number): Observable<OrderItem> {
    return this.api.post<OrderItem>(`/orders/${orderId}/products`, { product_id: productId, quantity })
  }

  checkout(payload: CheckoutPayload): Observable<CheckoutResponse> {
    return this.api.post<CheckoutResponse>('/orders/checkout', payload)
  }

  checkoutWithFallback(userId: number, items: CartItem[], payload: CheckoutPayload): Observable<CheckoutResponse> {
    if (!environment.apiCapabilities.checkout) {
      return this.legacyCheckout(userId, items, payload)
    }

    return this.checkout(payload).pipe(
      catchError(error => {
        if (error?.status !== 404) {
          return throwError(() => error)
        }

        return this.legacyCheckout(userId, items, payload)
      })
    )
  }

  private legacyCheckout(userId: number, items: CartItem[], payload: CheckoutPayload): Observable<CheckoutResponse> {
    return this.createOrder({
      user_id: userId,
      status: 'active' as Order['status'],
      payment_method: payload.paymentMethod,
      delivery_type: payload.deliveryType,
      delivery_address: payload.deliveryAddress || null,
      total_amount: items.reduce((total, item) => total + this.unitPrice(item.product) * item.quantity, 0)
    }).pipe(
      switchMap(order => forkJoin(items.map(item => this.addProduct(
        order.id as number,
        item.product.id,
        item.quantity
      ))).pipe(map(() => order))),
      map(order => ({
        message: 'Order created successfully.',
        order
      }))
    )
  }

  private unitPrice(product: { price: number; finalPrice?: number }): number {
    return Number(product.finalPrice ?? product.price)
  }
}
