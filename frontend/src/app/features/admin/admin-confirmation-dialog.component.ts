import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, Output } from '@angular/core'
import { TranslatePipe } from '../../core/i18n/translate.pipe'

@Component({
  selector: 'app-admin-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="admin-dialog-backdrop" role="presentation">
      <section class="admin-dialog" [class.discard-dialog]="tone === 'discard'" role="dialog" aria-modal="true" [attr.aria-label]="title">
        <div>
          <p class="eyebrow">{{ eyebrow || ('admin.confirmAction' | t) }}</p>
          <h2>{{ title }}</h2>
          <p class="muted">{{ message }}</p>
        </div>

        <div *ngIf="error" class="error">{{ error }}</div>

        <div class="admin-dialog-actions">
          <button type="button" class="secondary-button" [disabled]="loading" (click)="cancel.emit()">{{ cancelLabel || ('common.cancel' | t) }}</button>
          <button type="button" class="danger-button" [disabled]="loading" (click)="confirm.emit()">
            {{ loading ? ('admin.deleting' | t) : confirmLabel }}
          </button>
        </div>
      </section>
    </div>
  `
})
export class AdminConfirmationDialogComponent {
  @Input() eyebrow = ''
  @Input() title = 'Confirm action'
  @Input() message = 'This action cannot be undone.'
  @Input() confirmLabel = 'Confirm'
  @Input() cancelLabel = ''
  @Input() tone: 'default' | 'discard' = 'default'
  @Input() loading = false
  @Input() error = ''
  @Output() cancel = new EventEmitter<void>()
  @Output() confirm = new EventEmitter<void>()
}
