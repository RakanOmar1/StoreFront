export type ChatterEventType = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'COMMENT' | 'SYSTEM'

export interface ChatterItem {
  id: number
  entityType: string
  recordId: string
  eventType: ChatterEventType
  message?: string | null
  fieldName?: string | null
  oldValue?: string | null
  newValue?: string | null
  metadata?: Record<string, unknown> | null
  createdBy?: {
    id?: number | null
    name?: string | null
  }
  createdAt: string
}

export interface ChatterResponse {
  items: ChatterItem[]
  page: number
  pageSize: number
  total: number
}

export interface ChatterQueryParams {
  page?: number
  pageSize?: number
  eventType?: ChatterEventType
}
