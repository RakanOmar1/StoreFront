import { of } from 'rxjs'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  beforeEach(() => localStorage.clear())

  it('updates the authenticated customer through the self-service profile endpoint', () => {
    const updated = {
      id: 7,
      firstname: 'Updated',
      lastname: 'Customer',
      email: 'updated@example.com',
      role: 'CUSTOMER'
    }
    const api = {
      patch: jasmine.createSpy().and.returnValue(of(updated))
    }
    const service = new AuthService(api as any)
    let result: unknown

    service.updateProfile(7, { firstname: 'Updated', email: 'requested@example.com' }).subscribe(user => { result = user })

    expect(api.patch).toHaveBeenCalledWith('/profile', { firstname: 'Updated', email: 'requested@example.com' })
    expect(result).toEqual(updated)
    expect(JSON.parse(localStorage.getItem('user') || '{}')).toEqual(updated)
  })
})
