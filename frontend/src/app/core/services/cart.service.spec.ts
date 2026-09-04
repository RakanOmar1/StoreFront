import { of, throwError } from 'rxjs'
import { CartService } from './cart.service'
import { Product } from '../../shared/interfaces/product'

describe('CartService', () => {
  const product: Product = {
    id: 7,
    name: 'Milk',
    price: 10,
    finalPrice: 8,
    category: 'Dairy',
    url: '/milk.jpg',
    description: 'Fresh milk'
  }

  let service: CartService
  let api: any

  beforeEach(() => {
    localStorage.clear()
    api = {
      get: jasmine.createSpy().and.returnValue(of({ items: [] })),
      post: jasmine.createSpy().and.returnValue(of(null)),
      put: jasmine.createSpy().and.returnValue(of({ items: [] })),
      patch: jasmine.createSpy().and.returnValue(of(null)),
      delete: jasmine.createSpy().and.returnValue(of(null))
    }
    service = new CartService(api as any)
  })

  it('adds products, updates totals, and persists the cart', () => {
    service.addToCart(product, 2)

    expect(service.itemCount()).toBe(2)
    expect(service.subtotal()).toBe(16)
    expect(JSON.parse(localStorage.getItem('cart') || '[]').length).toBe(1)
  })

  it('normalizes quantities and removes zero quantities', () => {
    service.addToCart(product)
    service.updateQuantity(product.id, 3.8)
    expect(service.getItems()[0].quantity).toBe(3)

    service.updateQuantity(product.id, 500)
    expect(service.getItems()[0].quantity).toBe(99)

    service.updateQuantity(product.id, 0)
    expect(service.getItems()).toEqual([])
  })

  it('calculates active bundle prices', () => {
    service.addToCart({
      ...product,
      price: 5,
      finalPrice: 5,
      promotion: {
        id: 1,
        name: 'Three for ten',
        type: 'BUNDLE',
        value: 0,
        bundle_quantity: 3,
        bundle_price: 10,
        is_active: true
      }
    }, 4)

    expect(service.subtotal()).toBe(15)
  })

  it('synchronizes the complete guest state through the idempotent sync endpoint once', () => {
    service.addToCart(product, 2)

    service.syncToBackend().subscribe()
    service.syncToBackend().subscribe()

    expect(api.put).toHaveBeenCalledTimes(1)
    expect(api.put).toHaveBeenCalledWith('/cart/sync', {
      items: [{ productId: product.id, quantity: 2 }]
    })
    expect(api.post).not.toHaveBeenCalled()
  })

  it('allows synchronization to be retried after a server error', () => {
    service.addToCart(product)
    api.put.and.returnValues(throwError(() => ({ status: 500 })), of({ items: [] }))

    service.syncToBackend().subscribe()
    service.syncToBackend().subscribe()

    expect(api.put).toHaveBeenCalledTimes(2)
  })

  it('does not call the server for an empty guest cart', () => {
    service.syncToBackend().subscribe()

    expect(api.put).not.toHaveBeenCalled()
  })
})
