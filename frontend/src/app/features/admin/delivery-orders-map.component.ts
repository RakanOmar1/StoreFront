import { CommonModule } from '@angular/common'
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core'
import * as L from 'leaflet'
import { Router } from '@angular/router'
import { OpenStreetMapService } from '../../core/services/openstreet-map.service'
import { Order } from '../../shared/interfaces/order'

@Component({
  selector: 'app-delivery-orders-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="delivery-orders-map-card">
      <header>
        <div><span>Delivery map</span><h2>Order locations</h2></div>
        <strong>{{ deliveryOrders.length }} delivery orders</strong>
      </header>
      <div #mapCanvas class="delivery-orders-map-canvas"></div>
      <p *ngIf="loading" class="map-dialog-state">Locating delivery addresses…</p>
      <p *ngIf="error" class="map-dialog-state error">{{ error }}</p>
      <p *ngIf="!loading && !error && !deliveryOrders.length" class="map-dialog-state">There are no delivery orders with addresses.</p>
    </section>
  `
})
export class DeliveryOrdersMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() orders: Order[] = []
  @Input() focusOrderId: number | null = null
  @ViewChild('mapCanvas', { static: true }) mapCanvas!: ElementRef<HTMLElement>
  loading = false
  error = ''
  private viewReady = false
  private renderVersion = 0

  private map?: L.Map
  private markers?: L.LayerGroup

  constructor(private locations: OpenStreetMapService, private router: Router) {}

  get deliveryOrders(): Order[] {
    return this.orders.filter(order => order.delivery_type === 'DELIVERY' && !!order.delivery_address)
  }

  ngAfterViewInit(): void {
    this.viewReady = true
    this.renderMap()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['orders'] && this.viewReady) this.renderMap()
  }

  ngOnDestroy(): void { this.map?.remove() }

  private async renderMap(): Promise<void> {
    const version = ++this.renderVersion
    const orders = this.deliveryOrders
    this.error = ''
    if (!orders.length) return
    this.loading = true

    try {
      this.map?.remove()
      this.map = L.map(this.mapCanvas.nativeElement).setView({ lat: 31.9038, lng: 35.2034 }, 11)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(this.map)
      this.markers = L.layerGroup().addTo(this.map)
      window.setTimeout(() => this.map?.invalidateSize(), 0)
      const located: Array<{ order: Order; location: { lat: number; lng: number; address: string } }> = []
      for (const order of orders) {
        try { located.push({ order, location: await this.locations.geocodeAddress(order.delivery_address as string) }) }
        catch { /* keep rendering the addresses that can be resolved */ }
      }
      if (version !== this.renderVersion) return
      if (!located.length) {
        this.error = 'The map loaded, but none of the saved delivery addresses could be located. Add a city and street to each order address.'
        return
      }
      const bounds = L.latLngBounds([])
      const orderMarkers = new Map<number, { marker: L.Marker; location: { lat: number; lng: number } }>()
      located.forEach(item => {
        const marker = L.marker(item.location, { icon: this.markerIcon(), title: `Open order #${item.order.id}` })
          .bindPopup(`<strong>Order #${item.order.id}</strong><br>${this.escapeHtml(item.location.address)}`)
          .addTo(this.markers as L.LayerGroup)
        marker.on('click', () => {
          if (item.order.id != null) this.router.navigate(['/admin/orders', item.order.id])
        })
        if (item.order.id != null) orderMarkers.set(Number(item.order.id), { marker, location: item.location })
        bounds.extend(item.location)
      })
      const focused = this.focusOrderId == null ? undefined : orderMarkers.get(this.focusOrderId)
      if (focused) {
        this.map.setView(focused.location, 17)
        focused.marker.openPopup()
      } else if (located.length > 1) this.map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 })
      else this.map.setView(located[0].location, 16)
      const unresolved = orders.length - located.length
      if (unresolved) this.error = `${unresolved} delivery ${unresolved === 1 ? 'address was' : 'addresses were'} not precise enough to locate.`
    } catch {
      this.error = 'OpenStreetMap could not load or the order addresses could not be located.'
    } finally {
      if (version === this.renderVersion) this.loading = false
    }
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character] || character))
  }

  private markerIcon(): L.DivIcon {
    return L.divIcon({ className: 'store-map-marker delivery-map-marker', html: '<span></span>', iconSize: [30, 40], iconAnchor: [15, 40] })
  }
}
