import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AuthService } from '../../core/services/auth.service'
import { Router, RouterModule } from '@angular/router'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
  <section class="auth-page">
    <form class="auth-card" [formGroup]="f" (ngSubmit)="submit()">
      <div>
        <p class="eyebrow">Welcome back</p>
        <h1>Login</h1>
        <p class="muted">Sign in to checkout and manage your orders.</p>
      </div>

      <label>
        First name
        <input formControlName="firstname" placeholder="Ada" />
        <span *ngIf="f.controls.firstname.invalid && f.controls.firstname.touched">First name is required.</span>
      </label>

      <label>
        Password
        <input formControlName="password" type="password" placeholder="Your password" />
        <span *ngIf="f.controls.password.invalid && f.controls.password.touched">Password is required.</span>
      </label>

      <div *ngIf="error" class="error">{{ error }}</div>

      <button type="submit" [disabled]="f.invalid || submitting">
        {{ submitting ? 'Logging in...' : 'Login' }}
      </button>

      <p class="auth-switch">
        New here?
        <a routerLink="/auth/register">Create an account</a>
      </p>
    </form>
  </section>
  `
})
export class LoginComponent {
  submitting = false
  error: string | null = null

  f = this.fb.nonNullable.group({
    firstname: ['', Validators.required],
    password: ['', Validators.required]
  })

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit() {
    if (this.f.invalid) {
      this.f.markAllAsTouched()
      return
    }

    const { firstname, password } = this.f.getRawValue()
    this.submitting = true
    this.error = null

    this.auth.login(firstname, password).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.error = 'Invalid first name or password.'
        this.submitting = false
      }
    })
  }
}
