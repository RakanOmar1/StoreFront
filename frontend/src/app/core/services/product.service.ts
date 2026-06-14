import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Product } from '../../shared/interfaces/product'
import { environment } from '../../../environments/environment'

@Injectable({ providedIn: 'root' })
export class ProductService {
  private api = environment.apiUrl

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Partial<Product>[]>(`${this.api}/products`).pipe(
      map(products => products.map(product => this.withFallbacks(product)))
    )
  }

  getProduct(id: number | string): Observable<Product> {
    return this.http.get<Partial<Product>>(`${this.api}/products/${id}`).pipe(
      map(product => this.withFallbacks(product))
    )
  }

  private withFallbacks(product: Partial<Product>): Product {
    const name = product.name || 'SoleStreet Shoe'
    const category = product.category || 'footwear'

    return {
      id: Number(product.id) || 0,
      name,
      price: Number(product.price) || 0,
      category,
      url: product.url || this.fallbackImage(name, category),
      description: product.description || `${name} is a ${category} shoe from SoleStreet, selected for comfort, style, and everyday wear.`
    }
  }

  private fallbackImage(name: string, category: string): string {
    const label = encodeURIComponent(name)
    const palette = category === 'running'
      ? '37b878'
      : category === 'boots'
        ? 'd98435'
        : '8268d8'

    return `https://placehold.co/800x560/${palette}/111111?text=${label}`
  }
}
