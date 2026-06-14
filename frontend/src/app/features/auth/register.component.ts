import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AuthService } from '../../core/services/auth.service'
import { Router, RouterModule } from '@angular/router'

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
  <section class="auth-page">
    <form class="auth-card" [formGroup]="f" (ngSubmit)="submit()">
      <div>
        <p class="eyebrow">Create account</p>
        <h1>Register</h1>
        <p class="muted">Save your cart and place orders faster.</p>
      </div>

      <label>
        First name
        <input formControlName="firstname" placeholder="Ada" />
        <span *ngIf="f.controls.firstname.invalid && f.controls.firstname.touched">First name is required.</span>
      </label>

      <label>
        Last name
        <input formControlName="lastname" placeholder="Lovelace" />
        <span *ngIf="f.controls.lastname.invalid && f.controls.lastname.touched">Last name is required.</span>
      </label>

      <label>
        Password
        <input formControlName="password" type="password" placeholder="At least 6 characters" />
        <span *ngIf="f.controls.password.invalid && f.controls.password.touched">Password must be at least 6 characters.</span>
      </label>

      <div *ngIf="error" class="error">{{ error }}</div>

      <button type="submit" [disabled]="f.invalid || submitting">
        {{ submitting ? 'Creating account...' : 'Register' }}
      </button>

      <p class="auth-switch">
        Already have an account?
        <a routerLink="/auth/login">Login</a>
      </p>
    </form>
  </section>
  `
})
export class RegisterComponent {
  submitting = false
  error: string | null = null

  f = this.fb.nonNullable.group({
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]]
  })

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit() {
    if (this.f.invalid) {
      this.f.markAllAsTouched()
      return
    }

    this.submitting = true
    this.error = null

    this.auth.register(this.f.getRawValue()).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.error = 'Could not create account. Please try again.'
        this.submitting = false
      }
    })
  }
}
