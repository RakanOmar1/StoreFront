import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AuthService } from '../../core/services/auth.service'
import { CartService } from '../../core/services/cart.service'
import { Router, RouterModule } from '@angular/router'
import { switchMap } from 'rxjs/operators'
import { TranslatePipe } from '../../core/i18n/translate.pipe'
import { TranslationService } from '../../core/i18n/translation.service'
import { OpenStreetMapPickerComponent } from '../../shared/openstreet-map-picker.component'
import { MapPoint, ResolvedMapLocation } from '../../core/services/openstreet-map.service'

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslatePipe, OpenStreetMapPickerComponent],
  template: `
  <section class="auth-page">
    <div class="auth-shell">
      <aside class="auth-brand-panel" aria-hidden="true">
        <div class="auth-brand-lockup">
          <span>7</span>
          <strong>Stars Mall</strong>
        </div>
        <div>
          <p class="eyebrow">Fresh account</p>
          <h2>Create your supermarket profile.</h2>
          <p>Save delivery details, keep your grocery cart synced, and move through checkout faster.</p>
        </div>
        <div class="auth-benefits">
          <span>Saved cart</span>
          <span>Order history</span>
          <span>Fast delivery</span>
        </div>
      </aside>

      <form class="auth-card" [formGroup]="f" (ngSubmit)="submit()">
        <div>
          <p class="eyebrow">{{ 'auth.signupTitle' | t }}</p>
          <h1>{{ 'auth.registerTitle' | t }}</h1>
          <p class="muted">{{ 'auth.registerSubtitle' | t }}</p>
        </div>

        <label>
          {{ 'auth.firstName' | t }}
          <input formControlName="firstname" placeholder="Ada" autocomplete="given-name" />
          <span *ngIf="f.controls.firstname.invalid && f.controls.firstname.touched">{{ 'profile.firstNameRequired' | t }}</span>
        </label>

        <label>
          {{ 'auth.lastName' | t }}
          <input formControlName="lastname" placeholder="Lovelace" autocomplete="family-name" />
          <span *ngIf="f.controls.lastname.invalid && f.controls.lastname.touched">{{ 'profile.lastNameRequired' | t }}</span>
        </label>

        <label>
          {{ 'auth.email' | t }}
          <input formControlName="email" type="email" placeholder="ada@example.com" autocomplete="email" />
          <span *ngIf="f.controls.email.invalid && f.controls.email.touched">{{ 'profile.emailInvalid' | t }}</span>
        </label>

        <label>
          {{ 'auth.phone' | t }}
          <input formControlName="phone" placeholder="050-123-4567" autocomplete="tel" />
        </label>

        <div class="signup-location-block">
          <button type="button" class="location-button" [disabled]="locating" (click)="useCurrentLocation()">
            <i class="pi pi-map-marker" aria-hidden="true"></i>
            {{ locating ? ('auth.locating' | t) : ('auth.useMyLocation' | t) }}
          </button>
          <small>{{ 'auth.locationHint' | t }}</small>
          <small class="location-attribution">© OpenStreetMap contributors</small>
          <p *ngIf="locationMessage" class="location-status success">{{ locationMessage }}</p>
          <p *ngIf="locationError" class="location-status error">{{ locationError }}</p>
          <button *ngIf="showRamallahFallback" type="button" class="location-manual-button" (click)="selectRamallah()">
            {{ 'auth.selectRamallah' | t }}
          </button>
        </div>

        <label>
          {{ 'auth.address' | t }}
          <input formControlName="address" [placeholder]="'auth.addressPlaceholder' | t" autocomplete="street-address" />
          <span *ngIf="f.controls.address.invalid && f.controls.address.touched">{{ 'auth.addressRequired' | t }}</span>
        </label>

        <label>
          {{ 'auth.city' | t }}
          <input formControlName="city" [placeholder]="'auth.cityPlaceholder' | t" autocomplete="address-level2" />
          <span *ngIf="f.controls.city.invalid && f.controls.city.touched">{{ 'auth.cityRequired' | t }}</span>
        </label>

        <label>
          {{ 'auth.password' | t }}
          <input formControlName="password" type="password" placeholder="At least 6 characters" autocomplete="new-password" />
          <span *ngIf="f.controls.password.invalid && f.controls.password.touched">{{ 'profile.passwordMin' | t }}</span>
        </label>

        <div *ngIf="error" class="error">{{ error }}</div>

        <button type="submit" [disabled]="f.invalid || submitting">
          {{ submitting ? ('auth.creatingAccount' | t) : ('auth.registerTitle' | t) }}
        </button>

        <p class="auth-switch">
          {{ 'auth.alreadyHaveAccount' | t }}
          <a routerLink="/auth/login">{{ 'nav.login' | t }}</a>
        </p>
      </form>
    </div>
    <app-openstreet-map-picker
      *ngIf="mapOpen"
      [initialPoint]="mapPoint"
      [rtl]="i18n.currentLanguage === 'ar'"
      (selectedLocation)="applyMapLocation($event)"
      (cancel)="mapOpen = false"
    />
  </section>
  `
})
export class RegisterComponent {
  submitting = false
  locating = false
  error: string | null = null
  locationError: string | null = null
  locationMessage: string | null = null
  showRamallahFallback = false
  mapOpen = false
  mapPoint: MapPoint = { lat: 31.9038, lng: 35.2034 }

  f = this.fb.nonNullable.group({
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    address: ['', Validators.required],
    city: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]]
  })

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private cart: CartService,
    private router: Router,
    private i18n: TranslationService
  ) {}

  async useCurrentLocation(): Promise<void> {
    this.locationError = null
    this.locationMessage = null
    this.showRamallahFallback = false

    if (!window.isSecureContext) {
      this.locationError = this.i18n.translate('auth.locationSecureContext')
      this.mapOpen = true
      return
    }

    if (!navigator.geolocation) {
      this.locationError = this.i18n.translate('auth.locationUnsupported')
      this.mapOpen = true
      return
    }

    this.locating = true

    try {
      const position = await this.getBestPosition()
      const { latitude, longitude, accuracy } = position.coords
      this.mapPoint = { lat: latitude, lng: longitude }
      this.mapOpen = true
      if (!Number.isFinite(accuracy) || accuracy > 10000) {
        this.locationError = this.i18n.translate('auth.locationTooBroad', { accuracy: Math.round(Number(accuracy) / 1000) })
      }
    } catch (error) {
      const geolocationError = error as GeolocationPositionError
      this.locationError = geolocationError?.code === geolocationError?.PERMISSION_DENIED
        ? this.i18n.translate('auth.locationDenied')
        : this.i18n.translate('auth.locationUnavailable')
      this.showRamallahFallback = true
      this.mapOpen = true
    } finally {
      this.locating = false
    }
  }

  submit() {
    if (this.f.invalid) {
      this.f.markAllAsTouched()
      return
    }

    this.submitting = true
    this.error = null

    const payload = this.f.getRawValue()

    this.auth.register({
      ...payload,
      name: `${payload.firstname} ${payload.lastname}`.trim(),
      email: payload.email || null,
      phone: payload.phone || null
    }).pipe(
      switchMap(() => this.cart.syncToBackend()),
      switchMap(() => this.cart.loadBackendCart())
    ).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.error = this.i18n.translate('auth.createError')
        this.submitting = false
      }
    })
  }

  applyMapLocation(location: ResolvedMapLocation): void {
    this.f.patchValue({ city: location.city, address: location.address })
    this.f.controls.city.markAsTouched()
    this.f.controls.address.markAsTouched()
    this.mapPoint = { lat: location.lat, lng: location.lng }
    this.mapOpen = false
    this.locationError = null
    this.showRamallahFallback = false
    this.locationMessage = this.i18n.translate('auth.locationFoundCity', { city: location.city })
  }

  selectRamallah(): void {
    const city = this.i18n.currentLanguage === 'ar' ? 'رام الله' : 'Ramallah'
    const country = this.i18n.currentLanguage === 'ar' ? 'فلسطين' : 'Palestine'
    this.f.patchValue({ city, address: `${city}, ${country}` })
    this.f.controls.city.markAsTouched()
    this.f.controls.address.markAsTouched()
    this.locationError = null
    this.showRamallahFallback = false
    this.locationMessage = this.i18n.translate('auth.ramallahSelected')
  }

  private getBestPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      let best: GeolocationPosition | null = null
      let settled = false
      let watchId = 0

      const finish = (position?: GeolocationPosition, error?: GeolocationPositionError) => {
        if (settled) return
        settled = true
        navigator.geolocation.clearWatch(watchId)
        window.clearTimeout(timer)
        if (position) resolve(position)
        else reject(error || new Error('No location available'))
      }

      const timer = window.setTimeout(() => finish(best || undefined), 15000)
      watchId = navigator.geolocation.watchPosition(position => {
        if (!best || position.coords.accuracy < best.coords.accuracy) best = position
        if (position.coords.accuracy <= 250) finish(position)
      }, error => finish(best || undefined, error), {
        enableHighAccuracy: true,
        timeout: 14000,
        maximumAge: 0
      })
    })
  }
}

export function resolveNominatimCity(address?: {
  city?: string
  town?: string
  village?: string
  municipality?: string
  county?: string
  state_district?: string
  state?: string
}): string | null {
  return address?.city
    || address?.town
    || address?.village
    || address?.municipality
    || address?.county
    || address?.state_district
    || address?.state
    || null
}
