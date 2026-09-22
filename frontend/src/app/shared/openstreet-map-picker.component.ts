import { CommonModule } from '@angular/common'
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core'
import * as L from 'leaflet'
import { MapPoint, OpenStreetMapService, ResolvedMapLocation } from '../core/services/openstreet-map.service'

@Component({
  selector: 'app-openstreet-map-picker', standalone: true, imports: [CommonModule],
  template: `
    <div class="map-dialog-backdrop" (click)="cancel.emit()"></div>
    <section class="map-dialog" role="dialog" aria-modal="true" aria-labelledby="map-picker-title">
      <header><div><h2 id="map-picker-title">{{ rtl ? 'حدد موقعك على الخريطة' : 'Choose your location' }}</h2><p>{{ rtl ? 'انقر على الخريطة أو اسحب العلامة لتغيير نقطة التوصيل.' : 'Click the map or drag the marker to change the delivery point.' }}</p></div><button type="button" class="map-dialog-close" (click)="cancel.emit()" aria-label="Close map"><i class="pi pi-times" aria-hidden="true"></i></button></header>
      <div #mapCanvas class="map-picker-canvas"></div>
      <p *ngIf="loading" class="map-dialog-state">{{ rtl ? 'جاري تحديد العنوان…' : 'Finding the address…' }}</p>
      <p *ngIf="error" class="map-dialog-state error">{{ error }}</p>
      <footer><div class="map-selected-address"><strong>{{ rtl ? 'الموقع المحدد' : 'Selected location' }}</strong><span>{{ selected?.address || (rtl ? 'اختر نقطة على الخريطة' : 'Choose a point on the map') }}</span><small>© OpenStreetMap contributors</small></div><button type="button" class="secondary-button" (click)="cancel.emit()">{{ rtl ? 'إلغاء' : 'Cancel' }}</button><button type="button" [disabled]="!selected || loading" (click)="confirmSelection()">{{ rtl ? 'استخدام هذا الموقع' : 'Use this location' }}</button></footer>
    </section>`
})
export class OpenStreetMapPickerComponent implements AfterViewInit, OnDestroy {
  @Input() initialPoint: MapPoint = { lat: 31.9038, lng: 35.2034 }
  @Input() rtl = false
  @Output() selectedLocation = new EventEmitter<ResolvedMapLocation>()
  @Output() cancel = new EventEmitter<void>()
  @ViewChild('mapCanvas', { static: true }) mapCanvas!: ElementRef<HTMLElement>
  loading = true; error = ''; selected: ResolvedMapLocation | null = null
  private map?: L.Map; private marker?: L.Marker; private selectionVersion = 0

  constructor(private locations: OpenStreetMapService) {}

  ngAfterViewInit(): void {
    this.map = L.map(this.mapCanvas.nativeElement).setView(this.initialPoint, 16)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(this.map)
    this.marker = L.marker(this.initialPoint, { draggable: true, icon: this.markerIcon() }).addTo(this.map)
    this.map.on('click', event => this.choose(event.latlng))
    this.marker.on('dragend', () => this.choose(this.marker!.getLatLng()))
    window.setTimeout(() => this.map?.invalidateSize(), 0)
    this.choose(this.initialPoint)
  }
  ngOnDestroy(): void { this.map?.remove() }
  private async choose(point: MapPoint): Promise<void> {
    const version = ++this.selectionVersion; this.loading = true; this.error = ''; this.marker?.setLatLng(point)
    try { const value = await this.locations.reverseGeocode(point, this.rtl ? 'ar' : 'en'); if (version === this.selectionVersion) this.selected = value }
    catch { if (version === this.selectionVersion) this.error = this.rtl ? 'تعذر العثور على عنوان لهذه النقطة.' : 'No address was found for this point.' }
    finally { if (version === this.selectionVersion) this.loading = false }
  }
  confirmSelection(): void { if (this.selected) this.selectedLocation.emit(this.selected) }
  private markerIcon(): L.DivIcon { return L.divIcon({ className: 'store-map-marker', html: '<span></span>', iconSize: [30, 40], iconAnchor: [15, 40] }) }
}
