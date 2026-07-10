import { ActivityActor, ActivityEventType, ActivityLog, ActivityPage, ActivityQuery } from '../types/ActivityLog'
import { ActivityLogModel } from '../models/ActivityLogModel'

const IGNORED_FIELDS = new Set([
  'password',
  'confirm_password',
  'password_digest',
  'passwordDigest',
  'token',
  'accessToken',
  'refreshToken',
  'sessionId',
  'secret',
  'paymentCard',
  'cardNumber',
  'cvv'
])

const FIELD_LABELS: Record<string, string> = {
  id: 'ID',
  name: 'Name',
  firstname: 'First name',
  lastname: 'Last name',
  email: 'Email',
  phone: 'Phone',
  role: 'Role',
  is_active: 'Account status',
  price: 'Price',
  category: 'Category',
  category_id: 'Category',
  promotion_id: 'Promotion',
  description: 'Description',
  url: 'Image URL',
  images: 'Product images',
  user_id: 'User',
  status: 'Status',
  payment_status: 'Payment status',
  payment_method: 'Payment method',
  delivery_type: 'Delivery type',
  delivery_address: 'Delivery address',
  total_amount: 'Total amount'
}

const STATUS_FIELDS = new Set(['status', 'payment_status', 'delivery_type', 'role', 'is_active'])

export class ActivityLogService {
  private model = new ActivityLogModel()

  get ignoredFields(): string[] {
    return Array.from(IGNORED_FIELDS)
  }

  getActivity(entityType: string, recordId: string | number, query: ActivityQuery): Promise<ActivityPage> {
    return this.model.index(this.normalizeEntity(entityType), recordId, query)
  }

  getAllActivity(query: ActivityQuery & { entityType?: string; recordId?: string; search?: string }): Promise<ActivityPage> {
    return this.model.all(query)
  }

  async addComment(entityType: string, recordId: string | number, actor: ActivityActor | undefined, message: string): Promise<ActivityLog> {
    const normalizedMessage = this.cleanMessage(message)
    if (!normalizedMessage) {
      throw new Error('Message is required')
    }

    const normalizedEntity = this.normalizeEntity(entityType)
    const exists = await this.model.recordExists(normalizedEntity, recordId)
    if (!exists) {
      throw new Error('Record not found')
    }

    return this.model.create({
      entity_type: normalizedEntity,
      record_id: String(recordId),
      event_type: 'COMMENT',
      message: normalizedMessage,
      created_by_user_id: actor?.id || null
    })
  }

  logCreate(entityType: string, recordId: string | number, actor: ActivityActor | undefined, snapshot: Record<string, unknown>): Promise<ActivityLog> {
    const entity = this.normalizeEntity(entityType)
    return this.model.create({
      entity_type: entity,
      record_id: String(recordId),
      event_type: 'CREATE',
      message: `${this.entityLabel(entity)} created`,
      metadata: { snapshot: this.sanitizeSnapshot(snapshot) },
      created_by_user_id: actor?.id || null
    })
  }

  async logUpdate(entityType: string, recordId: string | number, actor: ActivityActor | undefined, before: Record<string, unknown>, after: Record<string, unknown>): Promise<ActivityLog[]> {
    const entity = this.normalizeEntity(entityType)
    const changes = this.changedFields(before, after)

    if (changes.length === 0) {
      return []
    }

    const logs: ActivityLog[] = []
    for (const change of changes) {
      const eventType: ActivityEventType = STATUS_FIELDS.has(change.field) ? 'STATUS_CHANGE' : 'UPDATE'
      logs.push(await this.model.create({
        entity_type: entity,
        record_id: String(recordId),
        event_type: eventType,
        message: `${change.label} updated`,
        field_name: change.field,
        old_value: change.oldValue,
        new_value: change.newValue,
        metadata: { label: change.label },
        created_by_user_id: actor?.id || null
      }))
    }

    return logs
  }

  logRelationshipChange(entityType: string, recordId: string | number, actor: ActivityActor | undefined, message: string): Promise<ActivityLog> {
    const entity = this.normalizeEntity(entityType)
    return this.model.create({
      entity_type: entity,
      record_id: String(recordId),
      event_type: 'UPDATE',
      message,
      created_by_user_id: actor?.id || null
    })
  }

  logDelete(entityType: string, recordId: string | number, actor: ActivityActor | undefined, snapshot: Record<string, unknown>): Promise<ActivityLog> {
    const entity = this.normalizeEntity(entityType)
    return this.model.create({
      entity_type: entity,
      record_id: String(recordId),
      event_type: 'DELETE',
      message: `${this.entityLabel(entity)} deleted`,
      metadata: { snapshot: this.sanitizeSnapshot(snapshot) },
      created_by_user_id: actor?.id || null
    })
  }

  private changedFields(before: Record<string, unknown>, after: Record<string, unknown>) {
    const keys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]))
    return keys
      .filter(key => !IGNORED_FIELDS.has(key) && key !== 'updated_at')
      .map(key => ({
        field: key,
        label: this.fieldLabel(key),
        oldValue: this.formatValue(before?.[key]),
        newValue: this.formatValue(after?.[key])
      }))
      .filter(change => change.oldValue !== change.newValue)
  }

  private sanitizeSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
    return Object.entries(snapshot || {}).reduce<Record<string, unknown>>((safe, [key, value]) => {
      if (!IGNORED_FIELDS.has(key)) {
        safe[key] = this.formatValue(value)
      }
      return safe
    }, {})
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return 'Empty'
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    if (value instanceof Date) {
      return value.toISOString()
    }
    if (typeof value === 'object') {
      if ('name' in (value as Record<string, unknown>)) {
        return String((value as Record<string, unknown>)['name'])
      }
      return JSON.stringify(value)
    }

    return String(value)
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, letter => letter.toUpperCase())
  }

  private fieldLabel(field: string): string {
    return FIELD_LABELS[field] || field.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
  }

  private entityLabel(entityType: string): string {
    return entityType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase())
  }

  private cleanMessage(message: string): string {
    return String(message || '').replace(/\s+/g, ' ').trim().slice(0, 2000)
  }

  private normalizeEntity(entityType: string): string {
    const value = String(entityType || '').toUpperCase()
    const map: Record<string, string> = {
      PRODUCTS: 'PRODUCT',
      PRODUCT: 'PRODUCT',
      CATEGORIES: 'CATEGORY',
      CATEGORY: 'CATEGORY',
      ORDERS: 'ORDER',
      ORDER: 'ORDER',
      USERS: 'USER',
      USER: 'USER',
      ADMIN: 'ADMIN_ACCOUNT',
      ADMIN_ACCOUNT: 'ADMIN_ACCOUNT',
      PROMOTIONS: 'PROMOTION',
      PROMOTION: 'PROMOTION'
    }

    return map[value] || value
  }
}
