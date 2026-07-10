import { ChangeDetectionStrategy, Component, ElementRef, HostListener } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, RouterModule } from '@angular/router'
import { map } from 'rxjs'
import { AuthService } from '../../core/services/auth.service'
import { CartService } from '../../core/services/cart.service'
import { TranslatePipe } from '../../core/i18n/translate.pipe'
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, LanguageSwitcherComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="app-header">
      <strong>
        <a [routerLink]="brandLink" class="brand-link">
          <span class="brand-mark" aria-hidden="true">7</span>
          <span class="brand-name">Stars Mall</span>
        </a>
      </strong>
      <nav>
        <a *ngIf="!(isAuthenticated$ | async)" routerLink="/cart" class="nav-link nav-pill">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 5h2l1.5 9.5h8.7L20 8H8" />
            <circle cx="10" cy="19" r="1.5" />
            <circle cx="17" cy="19" r="1.5" />
          </svg>
          {{ 'nav.cart' | t }} ({{ cartCount$ | async }})
        </a>
        <a *ngIf="!(isAuthenticated$ | async)" routerLink="/auth/login" class="nav-link nav-pill">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 17v2H5V5h5v2" />
            <path d="M14 8l4 4-4 4" />
            <path d="M8 12h10" />
          </svg>
          {{ 'nav.login' | t }}
        </a>
        <a *ngIf="!(isAuthenticated$ | async)" routerLink="/auth/register" class="nav-link nav-pill signup-link">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          {{ 'nav.signup' | t }}
        </a>
        <app-language-switcher />
        <div *ngIf="isAuthenticated$ | async" class="account-menu-wrap">
          <button
            type="button"
            class="profile-avatar"
            [attr.aria-label]="profileLabel"
            aria-haspopup="menu"
            [attr.aria-expanded]="menuOpen"
            (click)="toggleMenu($event)"
          >
            {{ profileInitials }}
          </button>

          <div *ngIf="menuOpen" class="account-menu" role="menu">
            <a routerLink="/profile" role="menuitem" (click)="closeMenu()">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {{ 'nav.myAccount' | t }}
            </a>
            <a routerLink="/cart" role="menuitem" (click)="closeMenu()">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 5h2l1.5 9.5h8.7L20 8H8" />
                <circle cx="10" cy="19" r="1.5" />
                <circle cx="17" cy="19" r="1.5" />
              </svg>
              {{ 'nav.cart' | t }} ({{ cartCount$ | async }})
            </a>
            <button type="button" role="menuitem" (click)="logout()">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 17v2H5V5h5v2" />
                <path d="M16 8l4 4-4 4" />
                <path d="M9 12h11" />
              </svg>
              {{ 'nav.logout' | t }}
            </button>
          </div>
        </div>
      </nav>
    </header>
  `
})
export class HeaderComponent {
  cartCount$ = this.cart.cart$.pipe(
    map(items => items.reduce((total, item) => total + item.quantity, 0))
  )
  isAuthenticated$ = this.auth.isAuthenticated$
  menuOpen = false

  constructor(
    private cart: CartService,
    private auth: AuthService,
    private router: Router,
    private elementRef: ElementRef<HTMLElement>
  ) {
    if (this.auth.getToken()) {
      this.cart.loadBackendCart().subscribe()
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeMenu()
    }
  }

  get profileInitials(): string {
    const user = this.auth.getCurrentUser()

    return `${user?.firstname?.[0] || ''}${user?.lastname?.[0] || ''}`.toUpperCase() || 'U'
  }

  get profileLabel(): string {
    const user = this.auth.getCurrentUser()
    const name = [user?.firstname, user?.lastname].filter(Boolean).join(' ')

    return name ? `${name} profile` : 'Profile'
  }

  get isAdmin(): boolean {
    const role = this.auth.getCurrentUser()?.role
    return role === 'ADMIN' || role === 'MANAGER'
  }

  get brandLink(): string {
    return this.isAdmin ? '/admin' : '/'
  }

  toggleMenu(event: MouseEvent) {
    event.stopPropagation()
    this.menuOpen = !this.menuOpen
  }

  closeMenu() {
    this.menuOpen = false
  }

  logout() {
    this.closeMenu()
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/auth/login'])
    })
  }
}
