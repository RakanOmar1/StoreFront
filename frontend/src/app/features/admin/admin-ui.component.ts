import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { RouterModule } from '@angular/router'

@Component({
  selector: 'app-admin-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="admin-page-header">
      <div class="admin-page-title">
        <p class="eyebrow">{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <p *ngIf="description" class="muted">{{ description }}</p>
      </div>
      <div class="admin-page-actions">
        <ng-content />
      </div>
    </header>
  `
})
export class AdminPageHeaderComponent {
  @Input() eyebrow = ''
  @Input() title = ''
  @Input() description = ''
}

@Component({
  selector: 'app-admin-state-block',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="admin-state-block" [class.error]="tone === 'error'" [attr.aria-live]="tone === 'error' ? 'assertive' : 'polite'">
      <div *ngIf="loading" class="admin-skeleton-stack" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="admin-state-copy">
        <strong>{{ title }}</strong>
        <p>{{ message }}</p>
      </div>
    </section>
  `
})
export class AdminStateBlockComponent {
  @Input() title = 'Loading'
  @Input() message = 'Preparing the latest data.'
  @Input() tone: 'neutral' | 'error' = 'neutral'
  @Input() loading = false
}

@Component({
  selector: 'app-admin-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="admin-status-badge" [class.inactive]="tone !== 'success'">{{ label }}</span>`
})
export class AdminStatusBadgeComponent {
  @Input() label = 'Active'
  @Input() tone: 'success' | 'neutral' = 'success'
}
