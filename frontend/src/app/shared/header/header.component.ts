import { ChangeDetectionStrategy, Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, RouterModule } from '@angular/router'
import { map } from 'rxjs'
import { AuthService } from '../../core/services/auth.service'
import { CartService } from '../../core/services/cart.service'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="app-header">
      <strong>
        <a routerLink="/" class="brand-link">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 15.5c3.2.9 6.1.9 8.5-.1 1.5-.6 2.7-.5 4 .2l3.6 1.8c1.2.6 1.9 1.4 1.9 2.2V21H3v-5.5Z" />
            <path d="M7.5 14.7 9 10l2.6 2.1c.8.7 1.8 1.1 2.8 1.3l2.8.5" />
          </svg>
          SoleStreet
        </a>
      </strong>
      <nav>
        <a routerLink="/cart" class="nav-link nav-pill">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 5h2l1.5 9.5h8.7L20 8H8" />
            <circle cx="10" cy="19" r="1.5" />
            <circle cx="17" cy="19" r="1.5" />
          </svg>
          Cart ({{ cartCount$ | async }})
        </a>
        <a *ngIf="!(isAuthenticated$ | async)" routerLink="/auth/login" class="nav-link nav-pill">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 17v2H5V5h5v2" />
            <path d="M14 8l4 4-4 4" />
            <path d="M8 12h10" />
          </svg>
          Login
        </a>
        <a *ngIf="!(isAuthenticated$ | async)" routerLink="/auth/register" class="nav-link nav-pill signup-link">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Sign up
        </a>
        <a *ngIf="isAuthenticated$ | async" routerLink="/profile" class="profile-avatar" [attr.aria-label]="profileLabel">
          {{ profileInitials }}
        </a>
        <button *ngIf="isAuthenticated$ | async" type="button" class="logout-button nav-link" (click)="logout()">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 17v2H5V5h5v2" />
            <path d="M16 8l4 4-4 4" />
            <path d="M9 12h11" />
          </svg>
          Logout
        </button>
      </nav>
    </header>
  `
})
export class HeaderComponent {
  cartCount$ = this.cart.cart$.pipe(
    map(items => items.reduce((total, item) => total + item.quantity, 0))
  )
  isAuthenticated$ = this.auth.isAuthenticated$

  constructor(private cart: CartService, private auth: AuthService, private router: Router) {}

  get profileInitials(): string {
    const user = this.auth.getCurrentUser()

    return `${user?.firstname?.[0] || ''}${user?.lastname?.[0] || ''}`.toUpperCase() || 'U'
  }

  get profileLabel(): string {
    const user = this.auth.getCurrentUser()
    const name = [user?.firstname, user?.lastname].filter(Boolean).join(' ')

    return name ? `${name} profile` : 'Profile'
  }

  logout() {
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/auth/login'])
    })
  }
}
