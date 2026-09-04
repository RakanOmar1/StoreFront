import { of } from 'rxjs'
import { ProductService } from './product.service'

describe('ProductService', () => {
  it('sends supported query filters and normalizes API products', done => {
    const api = {
      get: jasmine.createSpy().and.returnValue(of([{ id: '4', name: 'Bread', price: '12.5', final_price: '9' }]))
    }
    const service = new ProductService(api as any)

    service.getProducts({ search: 'bread', category: 'Bakery', maxPrice: 20, limit: 10, offset: 5, sort: 'price-desc' }).subscribe(products => {
      expect(api.get).toHaveBeenCalledWith('/products?search=bread&category=Bakery&maxPrice=20&limit=10&offset=5&sort=price-desc')
      expect(products[0].id).toBe(4)
      expect(products[0].price).toBe(12.5)
      expect(products[0].finalPrice).toBe(9)
      expect(products[0].images?.length).toBeGreaterThan(0)
      done()
    })
  })

  it('accepts wrapped product collections', done => {
    const api = { get: jasmine.createSpy().and.returnValue(of({ value: [{ id: 1, name: 'Tea', price: 4 }] })) }

    new ProductService(api as any).getProducts().subscribe(products => {
      expect(products.map(product => product.name)).toEqual(['Tea'])
      done()
    })
  })
})
