import { of } from 'rxjs'
import { ProductListComponent } from './product-list.component'

describe('ProductListComponent sorting', () => {
  it('reloads the first server page when sort changes', () => {
    const productService = { getProducts: jasmine.createSpy().and.returnValue(of([])) }
    const component = new ProductListComponent(
      productService as any,
      { cart$: of([]) } as any,
      { currentLanguage: 'en' } as any,
      { markForCheck: () => undefined } as any
    )

    component.changeSort('price-desc')

    expect(productService.getProducts).toHaveBeenCalledWith(jasmine.objectContaining({
      sort: 'price-desc', limit: 50, offset: 0
    }))
  })
})
