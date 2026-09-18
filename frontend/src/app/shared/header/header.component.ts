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
      <nav [attr.aria-label]="navigationLabel">
        <div *ngIf="!(isAuthenticated$ | async)" class="guest-menu-wrap">
          <button
            type="button"
            class="guest-menu-trigger"
            aria-haspopup="menu"
            [attr.aria-expanded]="menuOpen"
            aria-controls="guest-account-menu"
            (click)="toggleMenu($event)"
          >
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            {{ 'nav.menu' | t }}
            <svg class="menu-chevron" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m7 10 5 5 5-5" />
            </svg>
          </button>

          <div *ngIf="menuOpen" id="guest-account-menu" class="account-menu guest-menu" role="menu" (keydown)="onMenuKeydown($event)">
            <a routerLink="/cart" role="menuitem" (click)="closeMenu()">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 5h2l1.5 9.5h8.7L20 8H8" />
                <circle cx="10" cy="19" r="1.5" />
                <circle cx="17" cy="19" r="1.5" />
              </svg>
              {{ 'nav.cart' | t }} ({{ cartCount$ | async }})
            </a>
            <a routerLink="/auth/login" role="menuitem" (click)="closeMenu()">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 17v2H5V5h5v2" />
                <path d="M14 8l4 4-4 4" />
                <path d="M8 12h10" />
              </svg>
              {{ 'nav.login' | t }}
            </a>
            <a routerLink="/auth/register" role="menuitem" (click)="closeMenu()">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              {{ 'nav.signup' | t }}
            </a>
          </div>
        </div>
        <app-language-switcher />
        <div *ngIf="isAuthenticated$ | async" class="account-menu-wrap">
          <button
            type="button"
            class="profile-avatar authenticated-menu-trigger"
            [attr.aria-label]="profileLabel"
            aria-haspopup="menu"
            [attr.aria-expanded]="menuOpen"
            aria-controls="customer-account-menu"
            (click)="toggleMenu($event)"
          >
            <i class="pi pi-bars mobile-menu-icon" aria-hidden="true"></i>
            <span class="profile-initials">{{ profileInitials }}</span>
            <span class="mobile-menu-text">{{ 'nav.menu' | t }}</span>
          </button>

          <div *ngIf="menuOpen" id="customer-account-menu" class="account-menu" role="menu" (keydown)="onMenuKeydown($event)">
            <div class="account-menu-header">
              <span class="account-menu-avatar">{{ profileInitials }}</span>
              <span>
                <strong>{{ profileDisplayName }}</strong>
                <small *ngIf="profileEmail">{{ profileEmail }}</small>
              </span>
            </div>
            <a routerLink="/profile" role="menuitem" (click)="closeMenu()">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span class="menu-label">{{ 'nav.myAccount' | t }}</span>
            </a>
            <a routerLink="/cart" role="menuitem" (click)="closeMenu()">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 5h2l1.5 9.5h8.7L20 8H8" />
                <circle cx="10" cy="19" r="1.5" />
                <circle cx="17" cy="19" r="1.5" />
              </svg>
              <span class="menu-label">{{ 'nav.cart' | t }} <b>{{ cartCount$ | async }}</b></span>
            </a>
            <a routerLink="/orders" role="menuitem" (click)="closeMenu()">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 3h12v18H6z" />
                <path d="M9 8h6M9 12h6M9 16h4" />
              </svg>
              <span class="menu-label">{{ 'nav.myOrders' | t }}</span>
            </a>
            <button type="button" role="menuitem" (click)="logout()">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 17v2H5V5h5v2" />
                <path d="M16 8l4 4-4 4" />
                <path d="M9 12h11" />
              </svg>
              <span class="menu-label">{{ 'nav.logout' | t }}</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .app-header nav { min-width: 0; }
    .account-menu { max-inline-size: min(22rem, calc(100vw - 1.5rem)); }
    .account-menu-header { min-width: 0; }
    .account-menu-header strong,
    .account-menu-header small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .brand-link:focus-visible,
    nav button:focus-visible,
    .account-menu a:focus-visible,
    .account-menu button:focus-visible {
      outline: 3px solid #fbbf24;
      outline-offset: 3px;
    }
    @media (max-width: 390px) {
      .app-header { max-width: 100vw; }
      .brand-name { overflow: hidden; text-overflow: ellipsis; }
      .account-menu { max-inline-size: calc(100vw - 1rem); }
    }
  `]
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

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.menuOpen) return

    this.closeMenu()
    this.focusMenuTrigger()
  }

  get navigationLabel(): string {
    return 'Primary navigation'
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

  get profileDisplayName(): string {
    const user = this.auth.getCurrentUser()
    return [user?.firstname, user?.lastname].filter(Boolean).join(' ') || user?.name || 'Customer'
  }

  get profileEmail(): string {
    return this.auth.getCurrentUser()?.email || ''
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

    if (this.menuOpen) {
      setTimeout(() => this.menuItems()[0]?.focus())
    }
  }

  onMenuKeydown(event: KeyboardEvent): void {
    const items = this.menuItems()
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)
    let nextIndex: number | undefined

    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % items.length
    if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = items.length - 1
    if (event.key === 'Escape') {
      this.onEscape()
      event.preventDefault()
      return
    }

    if (nextIndex !== undefined && items.length) {
      event.preventDefault()
      items[nextIndex].focus()
    }
  }

  closeMenu() {
    this.menuOpen = false
  }

  logout() {
    this.closeMenu()
    this.auth.logout().subscribe(() => {
      this.cart.clear()
      this.router.navigate(['/auth/login'])
    })
  }

  private menuItems(): HTMLElement[] {
    return Array.from(this.elementRef.nativeElement.querySelectorAll<HTMLElement>('[role="menuitem"]'))
  }

  private focusMenuTrigger(): void {
    this.elementRef.nativeElement.querySelector<HTMLElement>('[aria-haspopup="menu"]')?.focus()
  }
}
