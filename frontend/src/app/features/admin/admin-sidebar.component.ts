import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { TranslatePipe } from '../../core/i18n/translate.pipe'

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <button type="button" class="admin-sidebar-toggle" (click)="toggleMenu()" [attr.aria-expanded]="menuOpen">
      {{ 'nav.menu' | t }}
    </button>
    <button *ngIf="menuOpen" type="button" class="admin-sidebar-backdrop" aria-label="Close admin menu" (click)="closeMenu()"></button>

    <aside class="admin-sidebar" [class.is-open]="menuOpen" aria-label="Admin navigation">
      <div class="admin-sidebar-brand">
        <span>7</span>
        <div>
          <strong>StoreFront</strong>
          <small>Admin</small>
        </div>
      </div>

      <nav class="admin-sidebar-nav">
        <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMenu()">
          <span><i class="pi pi-chart-line" aria-hidden="true"></i></span>
          {{ 'nav.dashboard' | t }}
        </a>
        <a routerLink="/admin/products" routerLinkActive="active" (click)="closeMenu()">
          <span><i class="pi pi-box" aria-hidden="true"></i></span>
          {{ 'nav.products' | t }}
        </a>
        <a routerLink="/admin/categories" routerLinkActive="active" (click)="closeMenu()">
          <span><i class="pi pi-tags" aria-hidden="true"></i></span>
          {{ 'nav.categories' | t }}
        </a>
        <a routerLink="/admin/promotions" routerLinkActive="active" (click)="closeMenu()">
          <span><i class="pi pi-percentage" aria-hidden="true"></i></span>
          {{ 'nav.promotions' | t }}
        </a>
        <a routerLink="/admin/orders" routerLinkActive="active" (click)="closeMenu()">
          <span><i class="pi pi-receipt" aria-hidden="true"></i></span>
          {{ 'nav.orders' | t }}
        </a>
        <a routerLink="/admin/payments" routerLinkActive="active" (click)="closeMenu()">
          <span><i class="pi pi-credit-card" aria-hidden="true"></i></span>
          {{ 'nav.payments' | t }}
        </a>
        <a routerLink="/admin/users" routerLinkActive="active" (click)="closeMenu()">
          <span><i class="pi pi-users" aria-hidden="true"></i></span>
          {{ 'nav.users' | t }}
        </a>
        <a routerLink="/profile" routerLinkActive="active" (click)="closeMenu()">
          <span><i class="pi pi-user" aria-hidden="true"></i></span>
          {{ 'nav.account' | t }}
        </a>
        <a routerLink="/products" (click)="closeMenu()">
          <span><i class="pi pi-shopping-bag" aria-hidden="true"></i></span>
          {{ 'nav.storefront' | t }}
        </a>
      </nav>
    </aside>
  `
})
export class AdminSidebarComponent {
  menuOpen = false

  toggleMenu() {
    this.menuOpen = !this.menuOpen
  }

  closeMenu() {
    this.menuOpen = false
  }
}
