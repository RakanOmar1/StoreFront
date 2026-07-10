import { CommonModule } from '@angular/common'
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { finalize } from 'rxjs/operators'
import { AdminChatterService } from '../../core/services/admin-chatter.service'
import { ChatterItem } from '../../shared/interfaces/admin-chatter'
import { TranslatePipe } from '../../core/i18n/translate.pipe'
import { TranslationService } from '../../core/i18n/translation.service'

@Component({
  selector: 'app-admin-chatter',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <aside class="chatter-panel">
      <div class="chatter-header">
        <div>
          <p class="eyebrow">{{ 'admin.activity' | t }}</p>
          <h2>{{ 'admin.chatter' | t }}</h2>
          <p>{{ 'admin.chatterSubtitle' | t }}</p>
        </div>
        <button *ngIf="recordId" type="button" class="chatter-refresh" (click)="load()" [disabled]="loading">{{ 'common.refresh' | t }}</button>
      </div>

      <div *ngIf="!recordId" class="chatter-placeholder">
        {{ 'admin.activityAfterCreate' | t }}
      </div>

      <ng-container *ngIf="recordId">
        <form *ngIf="allowComments" class="chatter-composer" (ngSubmit)="submitMessage()">
          <textarea
            name="chatterMessage"
            [(ngModel)]="message"
            maxlength="2000"
            [placeholder]="'admin.writeInternalNote' | t"
            [disabled]="submitting"
          ></textarea>
          <div class="chatter-composer-actions">
            <span>{{ 'admin.charactersLeft' | t: { count: remainingCharacters } }}</span>
            <button type="submit" class="admin-save-button" [disabled]="!message.trim() || submitting">
              {{ submitting ? ('admin.addingNote' | t) : ('admin.addNote' | t) }}
            </button>
          </div>
          <small *ngIf="submitError" class="field-error">{{ submitError }}</small>
        </form>

        <div class="chatter-timeline">
          <div *ngIf="loading" class="chatter-state">{{ 'admin.loadingActivity' | t }}</div>
          <div *ngIf="errorMessage && !loading" class="chatter-state error">{{ errorMessage }}</div>
          <div *ngIf="!loading && !errorMessage && items.length === 0" class="chatter-state">{{ 'admin.noActivity' | t }}</div>

          <ol *ngIf="items.length > 0" class="chatter-list">
          <li *ngFor="let item of items">
            <div class="chatter-avatar">{{ initials(item) }}</div>
            <div class="chatter-entry">
              <div class="chatter-entry-top">
                <strong>{{ actorName(item) }}</strong>
                <span>{{ item.createdAt | date:'medium' }}</span>
              </div>
              <p class="chatter-action">{{ activityText(item) }}</p>
              <blockquote *ngIf="item.eventType === 'COMMENT'">{{ item.message }}</blockquote>
              <div *ngIf="item.fieldName && item.eventType !== 'COMMENT'" class="chatter-change">
                <span>{{ displayValue(item.oldValue, item.fieldName) }}</span>
                <span aria-hidden="true">→</span>
                <span>{{ displayValue(item.newValue, item.fieldName) }}</span>
              </div>
            </div>
          </li>
          </ol>

          <button *ngIf="items.length < total && !loading" type="button" class="secondary-button chatter-load-more" (click)="loadMore()">
            {{ 'admin.loadOlderActivity' | t }}
          </button>
        </div>
      </ng-container>
    </aside>
  `
})
export class AdminChatterComponent implements OnChanges {
  @Input({ required: true }) entityType!: string
  @Input() recordId!: string | number | null
  @Input() allowComments = true

  items: ChatterItem[] = []
  loading = false
  submitting = false
  errorMessage = ''
  submitError = ''
  message = ''
  page = 1
  pageSize = 20
  total = 0

  constructor(private chatter: AdminChatterService, private i18n: TranslationService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['entityType'] || changes['recordId']) {
      this.items = []
      this.page = 1
      this.total = 0
      if (this.recordId) {
        this.load()
      }
    }
  }

  get remainingCharacters(): number {
    return 2000 - this.message.length
  }

  load(page = 1) {
    if (!this.recordId || this.loading) {
      return
    }

    this.loading = true
    this.errorMessage = ''
    this.chatter.getActivity(this.entityType, this.recordId, { page, pageSize: this.pageSize })
      .pipe(finalize(() => {
        this.loading = false
      }))
      .subscribe({
        next: response => {
          this.page = response.page
          this.total = response.total
          this.items = page === 1 ? response.items : [...this.items, ...response.items]
        },
        error: () => {
          this.errorMessage = this.i18n.translate('admin.loadActivityError')
        }
      })
  }

  loadMore() {
    this.load(this.page + 1)
  }

  submitMessage() {
    const trimmed = this.message.trim()
    if (!this.recordId || !trimmed || this.submitting) {
      return
    }

    this.submitting = true
    this.submitError = ''
    this.chatter.addMessage(this.entityType, this.recordId, trimmed)
      .pipe(finalize(() => {
        this.submitting = false
      }))
      .subscribe({
        next: item => {
          this.items = [item, ...this.items]
          this.total += 1
          this.message = ''
        },
        error: () => {
          this.submitError = this.i18n.translate('admin.addNoteError')
        }
      })
  }

  actorName(item: ChatterItem): string {
    return item.createdBy?.name || this.i18n.translate('admin.system')
  }

  initials(item: ChatterItem): string {
    return this.actorName(item)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'S'
  }

  activityText(item: ChatterItem): string {
    if (item.eventType === 'COMMENT') {
      return this.i18n.translate('admin.addedNote')
    }
    if (item.eventType === 'CREATE') {
      return this.i18n.translate('admin.createdRecord', { entity: this.entityLabel() })
    }
    if (item.eventType === 'DELETE') {
      return this.i18n.translate('admin.deletedRecord', { entity: this.entityLabel() })
    }
    if (item.eventType === 'STATUS_CHANGE') {
      return this.i18n.translate('admin.changedField', { field: this.fieldLabel(item.fieldName) })
    }
    if (item.fieldName) {
      return this.i18n.translate('admin.updatedField', { field: this.fieldLabel(item.fieldName) })
    }
    return item.message || this.i18n.translate('admin.updatedRecord')
  }

  fieldLabel(field?: string | null): string {
    if (!field) {
      return this.i18n.translate('admin.record')
    }

    const labels: Record<string, string> = {
      is_active: 'account status',
      payment_status: 'payment status',
      payment_method: 'payment method',
      delivery_type: 'delivery type',
      delivery_address: 'delivery address',
      total_amount: 'total amount',
      category_id: 'category',
      promotion_id: 'promotion',
      user_id: 'user',
      url: 'product image',
      image_url: 'product image',
      image: 'product image',
      images: 'product images',
      product_images: 'product images',
      created_at: 'created date',
      updated_at: 'updated date'
    }

    return labels[field] || field.replace(/_/g, ' ')
  }

  displayValue(value?: string | null, fieldName?: string | null): string {
    if (!value) {
      return this.i18n.translate('admin.empty')
    }

    const trimmed = String(value).trim()
    if (!trimmed) {
      return this.i18n.translate('admin.empty')
    }

    if (this.isMediaField(fieldName)) {
      return this.isUrl(trimmed) ? 'Image link' : this.compactText(trimmed)
    }

    const parsed = this.parseJson(trimmed)
    if (parsed !== null) {
      return this.describeStructuredValue(parsed)
    }

    if (this.isUrl(trimmed)) {
      return 'Link'
    }

    return this.compactText(trimmed)
  }

  private entityLabel(): string {
    return this.entityType.replace(/_/g, ' ').toLowerCase()
  }

  private isMediaField(fieldName?: string | null): boolean {
    return ['url', 'image_url', 'image', 'images', 'product_images'].includes((fieldName || '').toLowerCase())
  }

  private isUrl(value: string): boolean {
    return /^https?:\/\//i.test(value) || /^data:image\//i.test(value)
  }

  private parseJson(value: string): unknown | null {
    if (!/^[\[{]/.test(value)) {
      return null
    }

    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }

  private describeStructuredValue(value: unknown): string {
    if (Array.isArray(value)) {
      return value.length === 1 ? '1 item' : `${value.length} items`
    }

    if (value && typeof value === 'object') {
      return 'Details updated'
    }

    return this.compactText(String(value ?? ''))
  }

  private compactText(value: string): string {
    const normalized = value.replace(/\s+/g, ' ').trim()
    return normalized.length > 42 ? `${normalized.slice(0, 39)}...` : normalized
  }
}
