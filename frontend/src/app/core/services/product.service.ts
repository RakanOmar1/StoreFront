import { Injectable } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Product } from '../../shared/interfaces/product'
import { environment } from '../../../environments/environment'

export interface ProductQuery {
  search?: string
  category?: string
  maxPrice?: number
  limit?: number
  offset?: number
}

export interface ProductFilters {
  categories: string[]
  maxPrice: number
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private api = environment.apiUrl

  constructor(private http: HttpClient) {}

  getProducts(query: ProductQuery = {}): Observable<Product[]> {
    return this.http.get<Partial<Product>[]>(`${this.api}/products`, {
      params: this.toParams(query)
    }).pipe(
      map(products => products.map(product => this.withFallbacks(product)))
    )
  }

  getProductFilters(): Observable<ProductFilters> {
    return this.http.get<ProductFilters>(`${this.api}/products/filters`)
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

  private toParams(query: ProductQuery): HttpParams {
    let params = new HttpParams()

    if (query.search) {
      params = params.set('search', query.search)
    }

    if (query.category && query.category !== 'all') {
      params = params.set('category', query.category)
    }

    if (typeof query.maxPrice === 'number') {
      params = params.set('maxPrice', String(query.maxPrice))
    }

    if (typeof query.limit === 'number') {
      params = params.set('limit', String(query.limit))
    }

    if (typeof query.offset === 'number') {
      params = params.set('offset', String(query.offset))
    }

    return params
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
