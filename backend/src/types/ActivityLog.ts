export type ActivityEventType = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'COMMENT' | 'SYSTEM'

export type ActivityActor = {
  id?: number | null
  role?: string | null
}

export type ActivityLog = {
  id?: number
  entity_type: string
  record_id: string
  event_type: ActivityEventType
  message?: string | null
  field_name?: string | null
  old_value?: string | null
  new_value?: string | null
  metadata?: Record<string, unknown> | null
  created_by_user_id?: number | null
  created_at?: Date | string
  created_by_name?: string | null
}

export type ActivityQuery = {
  page?: number
  pageSize?: number
  eventType?: ActivityEventType
}

export type ActivityPage = {
  items: ActivityLog[]
  page: number
  pageSize: number
  total: number
}
