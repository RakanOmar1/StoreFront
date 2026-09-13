import { Injectable } from '@angular/core'

export interface MapPoint { lat: number; lng: number }
export interface ResolvedMapLocation extends MapPoint { address: string; city: string }
interface NominatimResult { lat?: string; lon?: string; display_name?: string; address?: Record<string, string> }
interface PhotonFeature { geometry?: { coordinates?: [number, number] }; properties?: Record<string, string> }

@Injectable({ providedIn: 'root' })
export class OpenStreetMapService {
  private readonly endpoint = 'https://nominatim.openstreetmap.org'
  private readonly cachePrefix = 'osm-geocode:'
  private nextRequestAt = 0

  async reverseGeocode(point: MapPoint, language = 'en'): Promise<ResolvedMapLocation> {
    const params = new URLSearchParams({ format: 'jsonv2', lat: String(point.lat), lon: String(point.lng), zoom: '18', addressdetails: '1', 'accept-language': language })
    return this.resolve(await this.request<NominatimResult>(`/reverse?${params.toString()}`), point)
  }

  async geocodeAddress(address: string, language = 'en'): Promise<ResolvedMapLocation> {
    const normalized = address.trim()
    const cacheKey = `${this.cachePrefix}${language}:${normalized.toLowerCase()}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try { return JSON.parse(cached) as ResolvedMapLocation } catch { localStorage.removeItem(cacheKey) }
    }
    const params = new URLSearchParams({ format: 'jsonv2', q: normalized, limit: '1', addressdetails: '1', 'accept-language': language })
    const matches = await this.request<NominatimResult[]>(`/search?${params.toString()}`)
    const resolved = matches[0] ? this.resolve(matches[0]) : await this.geocodeWithPhoton(normalized, language)
    try { localStorage.setItem(cacheKey, JSON.stringify(resolved)) } catch { /* optional cache */ }
    return resolved
  }

  private async geocodeWithPhoton(address: string, language: string): Promise<ResolvedMapLocation> {
    const params = new URLSearchParams({ q: address, limit: '1', lang: language === 'ar' ? 'en' : language })
    const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error(`Photon lookup failed: ${response.status}`)
    const payload = await response.json() as { features?: PhotonFeature[] }
    const feature = payload.features?.[0], coordinates = feature?.geometry?.coordinates
    if (!feature || !coordinates) throw new Error('Address could not be located')
    const properties = feature.properties || {}
    const formatted = [properties['name'], properties['street'], properties['city'], properties['state'], properties['country']].filter(Boolean).join(', ')
    return {
      lat: Number(coordinates[1]),
      lng: Number(coordinates[0]),
      address: formatted || address,
      city: properties['city'] || properties['district'] || properties['state'] || ''
    }
  }

  private resolve(match: NominatimResult, fallback?: MapPoint): ResolvedMapLocation {
    const lat = Number(match.lat ?? fallback?.lat), lng = Number(match.lon ?? fallback?.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Invalid map coordinates')
    const address = match.address
    return {
      lat, lng, address: match.display_name?.trim() || '',
      city: address?.['city'] || address?.['town'] || address?.['village'] || address?.['municipality'] || address?.['county'] || address?.['state_district'] || address?.['state'] || ''
    }
  }

  private async request<T>(path: string): Promise<T> {
    const wait = Math.max(0, this.nextRequestAt - Date.now())
    if (wait) await new Promise(resolve => window.setTimeout(resolve, wait))
    this.nextRequestAt = Date.now() + 1100
    const response = await fetch(`${this.endpoint}${path}`, { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error(`OpenStreetMap lookup failed: ${response.status}`)
    return response.json() as Promise<T>
  }
}
