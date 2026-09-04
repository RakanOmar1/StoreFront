import { of } from 'rxjs'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  beforeEach(() => localStorage.clear())

  it('updates the authenticated customer through the self-service profile endpoint', () => {
    const updated = {
      id: 7,
      firstname: 'Updated',
      lastname: 'Customer',
      role: 'CUSTOMER'
    }
    const api = {
      patch: jasmine.createSpy().and.returnValue(of(updated))
    }
    const service = new AuthService(api as any)
    let result: unknown

    service.updateProfile(7, { firstname: 'Updated' }).subscribe(user => { result = user })

    expect(api.patch).toHaveBeenCalledWith('/profile', { firstname: 'Updated' })
    expect(result).toEqual(jasmine.objectContaining(updated))
    expect(JSON.parse(localStorage.getItem('user') || '{}')).toEqual(jasmine.objectContaining(updated))
  })
})
