import { appRoutes } from './app-routing.module'

describe('application routes', () => {
  it('keeps directly navigable storefront routes registered', () => {
    expect(appRoutes.some(route => route.path === 'products')).toBeTrue()
    expect(appRoutes.some(route => route.path === 'products/:id')).toBeTrue()
  })

  it('redirects unknown client routes to the product catalog', () => {
    const fallbackIndex = appRoutes.findIndex(route => route.path === '**')
    const fallback = appRoutes[fallbackIndex]

    expect(fallbackIndex).toBe(appRoutes.length - 1)
    expect(fallback?.redirectTo).toBe('products')
  })
})
