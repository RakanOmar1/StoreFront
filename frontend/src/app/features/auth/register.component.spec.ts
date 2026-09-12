import { resolveNominatimCity } from './register.component'

describe('registration location resolution', () => {
  it('uses the most precise OpenStreetMap city-level field', () => {
    expect(resolveNominatimCity({ city: 'رام الله', state: 'فلسطين' })).toBe('رام الله')
    expect(resolveNominatimCity({ town: 'Ramallah', state: 'Palestine' })).toBe('Ramallah')
  })

  it('falls back through OpenStreetMap administrative fields', () => {
    expect(resolveNominatimCity({ village: 'Birzeit', state: 'Palestine' })).toBe('Birzeit')
    expect(resolveNominatimCity(undefined)).toBeNull()
  })
})
