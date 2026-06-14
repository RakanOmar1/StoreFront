import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { Order, OrderItem } from '../../shared/interfaces/order'
import { environment } from '../../../environments/environment'

@Injectable({ providedIn: 'root' })
export class OrderService {
  private api = environment.apiUrl

  constructor(private http: HttpClient) {}

  createOrder(order: Order): Observable<Order> {
    return this.http.post<Order>(`${this.api}/orders`, order)
  }

  addProduct(orderId: number | string, productId: number | string, quantity: number): Observable<OrderItem> {
    return this.http.post<OrderItem>(`${this.api}/orders/${orderId}/products`, { product_id: productId, quantity })
  }
}
