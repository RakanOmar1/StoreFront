import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { AuthService } from '../../core/services/auth.service'

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
  <section class="profile-page">
    <form class="profile-card" [formGroup]="f" (ngSubmit)="submit()">
      <aside class="profile-overview">
        <div class="profile-avatar-large" aria-hidden="true">{{ initials }}</div>
        <div class="profile-overview-copy">
          <p class="eyebrow">Account</p>
          <h1>Profile settings</h1>
          <p class="muted">Update your personal details for checkout and orders.</p>
        </div>
        <div class="profile-meta-card">
          <span>Signed in as</span>
          <strong>{{ fullName }}</strong>
        </div>
      </aside>

      <div class="profile-form-panel">
        <div class="profile-section-heading">
          <h2>Personal information</h2>
          <p class="muted">Use your real name so checkout details stay accurate.</p>
        </div>

        <div class="profile-grid">
          <label>
            First name
            <input formControlName="firstname" placeholder="First name" />
            <span *ngIf="f.controls.firstname.invalid && f.controls.firstname.touched">First name is required.</span>
          </label>

          <label>
            Last name
            <input formControlName="lastname" placeholder="Last name" />
            <span *ngIf="f.controls.lastname.invalid && f.controls.lastname.touched">Last name is required.</span>
          </label>

          <label class="span-2">
            New password
            <input formControlName="password" type="password" placeholder="Leave empty to keep current password" />
            <span *ngIf="f.controls.password.invalid && f.controls.password.touched">Password must be at least 6 characters.</span>
          </label>
        </div>

        <div *ngIf="success" class="success-message">Profile updated successfully.</div>
        <div *ngIf="error" class="error">{{ error }}</div>

        <div class="profile-actions">
          <a routerLink="/" class="button secondary-button">Cancel</a>
          <button type="submit" [disabled]="f.invalid || submitting">
            {{ submitting ? 'Saving...' : 'Save changes' }}
          </button>
        </div>
      </div>
    </form>
  </section>
  `
})
export class ProfileComponent {
  submitting = false
  success = false
  error: string | null = null
  private user = this.auth.getCurrentUser()

  f = this.fb.nonNullable.group({
    firstname: [this.user?.firstname || '', Validators.required],
    lastname: [this.user?.lastname || '', Validators.required],
    password: ['', Validators.minLength(6)]
  })

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  get initials(): string {
    const { firstname, lastname } = this.f.getRawValue()

    return `${firstname[0] || ''}${lastname[0] || ''}`.toUpperCase() || 'U'
  }

  get fullName(): string {
    const { firstname, lastname } = this.f.getRawValue()

    return [firstname, lastname].filter(Boolean).join(' ') || 'Your account'
  }

  submit() {
    if (this.f.invalid) {
      this.f.markAllAsTouched()
      return
    }

    const user = this.auth.getCurrentUser()

    if (!user?.id) {
      this.router.navigate(['/auth/login'])
      return
    }

    const { firstname, lastname, password } = this.f.getRawValue()
    this.submitting = true
    this.success = false
    this.error = null

    this.auth.updateProfile(user.id, {
      firstname,
      lastname,
      ...(password ? { password } : {})
    }).subscribe({
      next: () => {
        this.submitting = false
        this.success = true
        this.f.controls.password.reset('')
      },
      error: () => {
        this.error = 'Could not update profile. Please try again.'
        this.submitting = false
      }
    })
  }
}
