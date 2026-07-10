import { Component, HostListener } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { switchMap } from 'rxjs/operators'
import { AuthService } from '../../core/services/auth.service'
import { AdminChatterComponent } from '../admin/admin-chatter.component'
import { AdminConfirmationDialogComponent } from '../admin/admin-confirmation-dialog.component'
import { AdminSidebarComponent } from '../admin/admin-sidebar.component'
import { TranslatePipe } from '../../core/i18n/translate.pipe'
import { CanLeaveWithUnsavedChanges } from '../../core/guards/unsaved-changes.guard'

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AdminSidebarComponent, AdminChatterComponent, AdminConfirmationDialogComponent, TranslatePipe],
  template: `
  <ng-container *ngIf="isAdmin; else regularProfile">
    <section class="admin-shell">
      <app-admin-sidebar />
      <div class="admin-shell-content admin-profile-content">
        <section class="profile-page record-page">
          <div class="record-layout profile-record-layout">
            <section class="record-content">
              <ng-container *ngTemplateOutlet="profileContent"></ng-container>
            </section>

            <aside class="record-chatter">
              <app-admin-chatter
                entityType="USER"
                [recordId]="user?.id || null"
                [allowComments]="true"
              />
            </aside>
          </div>
        </section>
      </div>
    </section>
  </ng-container>

  <ng-template #regularProfile>
    <section class="profile-page">
      <ng-container *ngTemplateOutlet="profileContent"></ng-container>
    </section>
  </ng-template>

  <ng-template #profileContent>
    <form class="profile-card" [formGroup]="f" (ngSubmit)="submit()">
      <aside class="profile-overview">
        <div class="profile-avatar-large" aria-hidden="true">{{ initials }}</div>
        <div class="profile-overview-copy">
          <p class="eyebrow">{{ 'profile.account' | t }}</p>
          <h1>{{ 'profile.title' | t }}</h1>
          <p class="muted">{{ 'profile.subtitle' | t }}</p>
        </div>
        <div class="profile-meta-card">
          <span>{{ 'profile.signedInAs' | t }}</span>
          <strong>{{ fullName }}</strong>
          <small>{{ 'profile.userNumber' | t }} #{{ user?.id || '-' }} · {{ user?.role || 'CUSTOMER' }} · {{ user?.is_active === false ? ('common.inactive' | t) : ('common.active' | t) }}</small>
        </div>
      </aside>

      <div class="profile-form-panel">
        <div class="profile-section-heading">
          <div>
            <h2>{{ 'profile.personalInformation' | t }}</h2>
            <p class="muted">{{ 'profile.personalSubtitle' | t }}</p>
          </div>
          <button *ngIf="!isEditing" type="button" class="edit-profile-button" (click)="edit()">
            {{ 'common.edit' | t }}
          </button>
        </div>

        <div *ngIf="!isEditing" class="profile-readonly-grid">
          <div>
            <span>{{ 'profile.firstName' | t }}</span>
            <strong>{{ f.controls.firstname.value || '-' }}</strong>
          </div>
          <div>
            <span>{{ 'profile.lastName' | t }}</span>
            <strong>{{ f.controls.lastname.value || '-' }}</strong>
          </div>
          <div>
            <span>{{ 'profile.email' | t }}</span>
            <strong>{{ f.controls.email.value || '-' }}</strong>
          </div>
          <div>
            <span>{{ 'profile.phone' | t }}</span>
            <strong>{{ f.controls.phone.value || '-' }}</strong>
          </div>
          <div>
            <span>{{ 'profile.address' | t }}</span>
            <strong>{{ f.controls.address.value || '-' }}</strong>
          </div>
          <div>
            <span>{{ 'profile.city' | t }}</span>
            <strong>{{ f.controls.city.value || '-' }}</strong>
          </div>
          <div>
            <span>{{ 'common.role' | t }}</span>
            <strong>{{ user?.role || 'CUSTOMER' }}</strong>
          </div>
          <div>
            <span>{{ 'profile.accountStatus' | t }}</span>
            <strong>{{ user?.is_active === false ? ('common.inactive' | t) : ('common.active' | t) }}</strong>
          </div>
        </div>

        <div *ngIf="isEditing" class="profile-grid">
          <label>
            {{ 'profile.firstName' | t }}
            <input formControlName="firstname" [placeholder]="'profile.firstName' | t" />
            <span *ngIf="f.controls.firstname.invalid && f.controls.firstname.touched">{{ 'profile.firstNameRequired' | t }}</span>
          </label>

          <label>
            {{ 'profile.lastName' | t }}
            <input formControlName="lastname" [placeholder]="'profile.lastName' | t" />
            <span *ngIf="f.controls.lastname.invalid && f.controls.lastname.touched">{{ 'profile.lastNameRequired' | t }}</span>
          </label>

          <label class="span-2">
            {{ 'profile.email' | t }}
            <input formControlName="email" type="email" placeholder="you@example.com" />
            <span *ngIf="f.controls.email.invalid && f.controls.email.touched">{{ 'profile.emailInvalid' | t }}</span>
          </label>

          <label class="span-2">
            {{ 'profile.phone' | t }}
            <input formControlName="phone" placeholder="050-123-4567" />
          </label>

          <label class="span-2">
            {{ 'profile.address' | t }}
            <input formControlName="address" placeholder="123 Market Street" />
          </label>

          <label class="span-2">
            {{ 'profile.city' | t }}
            <input formControlName="city" placeholder="Jerusalem" />
          </label>

          <label>
            {{ 'common.role' | t }}
            <input [value]="user?.role || 'CUSTOMER'" disabled />
          </label>

          <label>
            {{ 'profile.accountStatus' | t }}
            <input [value]="user?.is_active === false ? ('common.inactive' | t) : ('common.active' | t)" disabled />
          </label>

          <div class="span-2 password-management">
            <div>
              <span>{{ 'profile.password' | t }}</span>
              <strong>{{ 'profile.protected' | t }}</strong>
            </div>
            <button type="button" class="secondary-button" (click)="openPasswordWizard()">{{ 'profile.changePassword' | t }}</button>
          </div>
        </div>

        <div *ngIf="success" class="success-message">{{ 'profile.updated' | t }}</div>
        <div *ngIf="error" class="error">{{ error }}</div>

        <div *ngIf="isEditing" class="profile-actions">
          <button type="button" class="secondary-button" (click)="cancelEdit()">{{ 'common.cancel' | t }}</button>
          <button type="submit" [disabled]="f.invalid || submitting">
            {{ submitting ? ('common.saving' | t) : ('common.saveChanges' | t) }}
          </button>
        </div>
      </div>
    </form>

    <div *ngIf="passwordWizardOpen" class="modal-backdrop" (click)="closePasswordWizard()">
      <form class="password-wizard" [formGroup]="passwordForm" (ngSubmit)="submitPassword()" (click)="$event.stopPropagation()">
        <div class="modal-heading">
          <p class="eyebrow">{{ 'profile.security' | t }}</p>
          <h2>{{ 'profile.changePassword' | t }}</h2>
          <p class="muted">{{ 'profile.passwordSubtitle' | t }}</p>
        </div>

        <label>
          {{ 'profile.currentPassword' | t }}
          <input formControlName="currentPassword" type="password" [placeholder]="'profile.currentPassword' | t" />
          <span *ngIf="passwordForm.controls.currentPassword.invalid && passwordForm.controls.currentPassword.touched">{{ 'profile.currentPasswordRequired' | t }}</span>
        </label>

        <label>
          {{ 'profile.newPassword' | t }}
          <input formControlName="newPassword" type="password" [placeholder]="'profile.passwordPlaceholder' | t" />
          <span *ngIf="passwordForm.controls.newPassword.invalid && passwordForm.controls.newPassword.touched">{{ 'profile.passwordMin' | t }}</span>
        </label>

        <label>
          {{ 'profile.confirmPassword' | t }}
          <input formControlName="confirmPassword" type="password" [placeholder]="'profile.repeatPassword' | t" />
          <span *ngIf="passwordMismatch && passwordForm.controls.confirmPassword.touched">{{ 'profile.passwordMismatch' | t }}</span>
        </label>

        <div *ngIf="passwordSuccess" class="success-message">{{ 'profile.passwordChanged' | t }}</div>
        <div *ngIf="passwordError" class="error">{{ passwordError }}</div>

        <div class="modal-actions">
          <button type="button" class="secondary-button" (click)="closePasswordWizard()">{{ 'common.cancel' | t }}</button>
          <button type="submit" [disabled]="passwordForm.invalid || passwordMismatch || passwordSubmitting">
            {{ passwordSubmitting ? ('common.saving' | t) : ('profile.savePassword' | t) }}
          </button>
        </div>
      </form>
    </div>

    <app-admin-confirmation-dialog
      *ngIf="discardDialogOpen"
      eyebrow="Unsaved changes"
      title="Discard unsaved changes?"
      message="You have changes that have not been saved. If you leave now, the edits on this page will be lost."
      cancelLabel="Keep editing"
      confirmLabel="Discard changes"
      tone="discard"
      [loading]="false"
      [error]="''"
      (cancel)="resolveDiscard(false)"
      (confirm)="resolveDiscard(true)"
    />
  </ng-template>
  `
})
export class ProfileComponent implements CanLeaveWithUnsavedChanges {
  submitting = false
  success = false
  error: string | null = null
  isEditing = false
  passwordWizardOpen = false
  passwordSubmitting = false
  passwordSuccess = false
  passwordError: string | null = null
  discardDialogOpen = false
  private discardResolver?: (discard: boolean) => void
  user = this.auth.getCurrentUser()

  f = this.fb.nonNullable.group({
    firstname: [this.user?.firstname || '', Validators.required],
    lastname: [this.user?.lastname || '', Validators.required],
    email: [this.user?.email || '', Validators.email],
    phone: [this.user?.phone || ''],
    address: [this.user?.address || ''],
    city: [this.user?.city || '']
  })

  passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  })

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  get isAdmin(): boolean {
    return this.user?.role === 'ADMIN' || this.user?.role === 'MANAGER'
  }

  get initials(): string {
    const { firstname, lastname } = this.f.getRawValue()

    return `${firstname[0] || ''}${lastname[0] || ''}`.toUpperCase() || 'U'
  }

  get fullName(): string {
    const { firstname, lastname } = this.f.getRawValue()

    return [firstname, lastname].filter(Boolean).join(' ') || 'Your account'
  }

  edit() {
    this.success = false
    this.error = null
    this.isEditing = true
  }

  cancelEdit() {
    this.user = this.auth.getCurrentUser()
    this.f.patchValue({
      firstname: this.user?.firstname || '',
      lastname: this.user?.lastname || '',
      email: this.user?.email || '',
      phone: this.user?.phone || '',
      address: this.user?.address || '',
      city: this.user?.city || '',
    })
    this.f.markAsPristine()
    this.isEditing = false
    this.success = false
    this.error = null
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

    const { firstname, lastname, email, phone, address, city } = this.f.getRawValue()
    this.submitting = true
    this.success = false
    this.error = null

    this.auth.updateProfile(user.id, {
      firstname,
      lastname,
      name: `${firstname} ${lastname}`.trim(),
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null
    }).subscribe({
      next: savedUser => {
        this.user = savedUser
        this.submitting = false
        this.success = true
        this.isEditing = false
        this.f.markAsPristine()
      },
      error: () => {
        this.error = 'Could not update profile. Please try again.'
        this.submitting = false
      }
    })
  }

  get passwordMismatch(): boolean {
    const { newPassword, confirmPassword } = this.passwordForm.getRawValue()
    return !!confirmPassword && newPassword !== confirmPassword
  }

  openPasswordWizard() {
    this.passwordWizardOpen = true
    this.passwordSuccess = false
    this.passwordError = null
    this.passwordForm.reset()
  }

  closePasswordWizard() {
    if (this.passwordSubmitting) {
      return
    }

    this.passwordWizardOpen = false
    this.passwordSuccess = false
    this.passwordError = null
    this.passwordForm.reset()
    this.passwordForm.markAsPristine()
  }

  submitPassword() {
    if (this.passwordForm.invalid || this.passwordMismatch) {
      this.passwordForm.markAllAsTouched()
      return
    }

    const user = this.auth.getCurrentUser()

    if (!user?.id) {
      this.router.navigate(['/auth/login'])
      return
    }

    const { currentPassword, newPassword } = this.passwordForm.getRawValue()
    const identifier = user.email || user.phone || user.firstname || user.name || ''
    this.passwordSubmitting = true
    this.passwordSuccess = false
    this.passwordError = null

    this.auth.login(identifier, currentPassword, user.firstname).pipe(
      switchMap(() => this.auth.updateProfile(user.id as number, {
        firstname: user.firstname,
        lastname: user.lastname,
        name: user.name || [user.firstname, user.lastname].filter(Boolean).join(' '),
        email: user.email || null,
        phone: user.phone || null,
        address: user.address || null,
        city: user.city || null,
        password: newPassword
      }))
    ).subscribe({
      next: () => {
        this.passwordSubmitting = false
        this.passwordSuccess = true
        this.passwordForm.reset()
        this.passwordForm.markAsPristine()
        window.setTimeout(() => this.closePasswordWizard(), 900)
      },
      error: () => {
        this.passwordError = 'Current password is incorrect or the password could not be changed.'
        this.passwordSubmitting = false
      }
    })
  }

  hasUnsavedChanges(): boolean {
    return (this.isEditing && this.f.dirty) || (this.passwordWizardOpen && this.passwordForm.dirty)
  }

  confirmDiscardChanges(): Promise<boolean> {
    if (this.discardDialogOpen) {
      return Promise.resolve(false)
    }

    this.discardDialogOpen = true
    return new Promise(resolve => {
      this.discardResolver = resolve
    })
  }

  resolveDiscard(discard: boolean) {
    this.discardDialogOpen = false
    this.discardResolver?.(discard)
    this.discardResolver = undefined
  }

  @HostListener('window:beforeunload', ['$event'])
  warnBeforeUnload(event: BeforeUnloadEvent) {
    if (!this.hasUnsavedChanges()) {
      return
    }

    event.preventDefault()
    event.returnValue = ''
  }
}
