import { Injectable } from '@angular/core'
import { HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Product } from '../../shared/interfaces/product'
import { ApiUrlService } from './api-url.service'

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
  constructor(private api: ApiUrlService) {}

  getProducts(query: ProductQuery = {}): Observable<Product[]> {
    const params = this.toParams(query).toString()
    const path = params ? `/products?${params}` : '/products'

    return this.api.get<Partial<Product>[] | { value?: Partial<Product>[] }>(path).pipe(
      map(response => this.asList(response).map(product => this.withFallbacks(product)))
    )
  }

  getProductFilters(): Observable<ProductFilters> {
    return this.api.get<ProductFilters>('/products/filters')
  }

  getProduct(id: number | string): Observable<Product> {
    return this.api.get<Partial<Product>>(`/products/${id}`).pipe(
      map(product => this.withFallbacks(product))
    )
  }

  private withFallbacks(product: Partial<Product>): Product {
    const apiProduct = product as Partial<Product> & { final_price?: number }
    const name = product.name || '7 Stars Product'
    const category = product.category || 'supermarket'
    const finalPrice = apiProduct.finalPrice ?? apiProduct.final_price ?? product.price
    const fallbackUrl = product.url || this.fallbackImage(name, category)
    const images = this.normalizeImages(product.images, fallbackUrl)

    return {
      id: Number(product.id) || 0,
      name,
      price: Number(product.price) || 0,
      finalPrice: Number(finalPrice) || 0,
      category,
      category_id: product.category_id ?? null,
      promotion_id: product.promotion_id ?? null,
      promotion: product.promotion || null,
      url: images[0],
      images,
      description: product.description || `${name} is a ${category} item from 7 Stars Mall, selected for quality, value, and everyday home needs.`,
      created_at: product.created_at,
      updated_at: product.updated_at
    }
  }

  private normalizeImages(images: unknown, fallbackUrl: string): string[] {
    const list = Array.isArray(images) ? images : []
    const normalized = list
      .map(image => String(image || '').trim())
      .filter(Boolean)

    normalized.unshift(fallbackUrl)

    return Array.from(new Set(normalized)).slice(0, 5)
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
    const images: Record<string, string> = {
      fresh: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80',
      produce: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80',
      bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
      dairy: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=80',
      pantry: 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?auto=format&fit=crop&w=900&q=80',
      drinks: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80',
      household: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=900&q=80',
      cleaning: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=900&q=80',
      personal: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80',
      frozen: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=900&q=80'
    }

    return images[category.toLowerCase()] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80'
  }
}



