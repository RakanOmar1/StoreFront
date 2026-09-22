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
  selector: 'app-login',
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
          <p class="eyebrow">{{ 'auth.loginBrandEyebrow' | t }}</p>
          <h2>{{ 'auth.loginBrandTitle' | t }}</h2>
          <p>{{ 'auth.loginBrandDescription' | t }}</p>
        </div>
        <div class="auth-benefits">
          <span><i class="pi pi-sparkles" aria-hidden="true"></i>{{ 'auth.freshPicks' | t }}</span>
          <span><i class="pi pi-shield" aria-hidden="true"></i>{{ 'auth.secureCheckout' | t }}</span>
          <span><i class="pi pi-send" aria-hidden="true"></i>{{ 'auth.fastDelivery' | t }}</span>
        </div>
      </aside>

      <form class="auth-card login-card" [formGroup]="f" (ngSubmit)="submit()">
        <div>
          <p class="eyebrow">{{ 'auth.welcomeBack' | t }}</p>
          <h1>{{ 'auth.loginTitle' | t }}</h1>
          <p class="muted">{{ 'auth.loginSubtitle' | t }}</p>
        </div>

        <label>
          {{ 'auth.identifier' | t }}
          <input formControlName="identifier" [placeholder]="'auth.identifierPlaceholder' | t" autocomplete="username" />
          <span *ngIf="f.controls.identifier.invalid && f.controls.identifier.touched">{{ 'auth.identifierRequired' | t }}</span>
        </label>

        <label>
          {{ 'auth.password' | t }}
          <span class="password-input-wrap">
            <input formControlName="password" [type]="passwordVisible ? 'text' : 'password'" [placeholder]="'auth.passwordPlaceholder' | t" autocomplete="current-password" />
            <button
              type="button"
              class="password-visibility-button"
              (click)="passwordVisible = !passwordVisible"
              [attr.aria-label]="(passwordVisible ? 'auth.hidePassword' : 'auth.showPassword') | t"
              [attr.aria-pressed]="passwordVisible"
            >
              <i class="pi" [class.pi-eye]="!passwordVisible" [class.pi-eye-slash]="passwordVisible" aria-hidden="true"></i>
            </button>
          </span>
          <span *ngIf="f.controls.password.invalid && f.controls.password.touched">{{ 'auth.passwordRequired' | t }}</span>
        </label>

        <div *ngIf="error" class="error">{{ error }}</div>

        <button type="submit" [disabled]="f.invalid || submitting">
          {{ submitting ? ('auth.loggingIn' | t) : ('nav.login' | t) }}
        </button>

        <p class="auth-switch">
          {{ 'auth.newHere' | t }}
          <a routerLink="/auth/register">{{ 'auth.createAccount' | t }}</a>
        </p>
      </form>
    </div>
  </section>
  `
})
export class LoginComponent {
  submitting = false
  passwordVisible = false
  error: string | null = null

  f = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required]
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

    const { identifier, password } = this.f.getRawValue()
    this.submitting = true
    this.error = null

    this.auth.login(identifier, password).pipe(
      switchMap(() => this.cart.syncToBackend()),
      switchMap(() => this.cart.loadBackendCart())
    ).subscribe({
      next: () => {
        const user = this.auth.getCurrentUser()
        this.router.navigate([user?.role === 'ADMIN' || user?.role === 'MANAGER' ? '/admin' : '/'])
      },
      error: () => {
        this.error = this.i18n.translate('auth.invalidLogin')
        this.submitting = false
      }
    })
  }
}
