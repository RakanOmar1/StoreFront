import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AuthService } from '../../core/services/auth.service'
import { CartService } from '../../core/services/cart.service'
import { Router, RouterModule } from '@angular/router'
import { switchMap } from 'rxjs/operators'
import { TranslatePipe } from '../../core/i18n/translate.pipe'
import { TranslationService } from '../../core/i18n/translation.service'

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslatePipe],
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
  </section>
  `
})
export class RegisterComponent {
  submitting = false
  error: string | null = null

  f = this.fb.nonNullable.group({
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    email: ['', Validators.email],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]]
  })

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private cart: CartService,
    private router: Router,
    private i18n: TranslationService
  ) {}

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
}
