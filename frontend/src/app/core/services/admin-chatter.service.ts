import { Injectable } from '@angular/core'
import { map, Observable } from 'rxjs'
import { ChatterItem, ChatterQueryParams, ChatterResponse } from '../../shared/interfaces/admin-chatter'
import { ApiUrlService } from './api-url.service'

type ApiActivityLog = {
  id: number
  entity_type: string
  record_id: string
  event_type: ChatterItem['eventType']
  message?: string | null
  field_name?: string | null
  old_value?: string | null
  new_value?: string | null
  metadata?: Record<string, unknown> | null
  created_by_user_id?: number | null
  created_by_name?: string | null
  created_at: string
}

type ApiActivityPage = {
  items: ApiActivityLog[]
  page: number
  pageSize: number
  total: number
}

@Injectable({ providedIn: 'root' })
export class AdminChatterService {
  constructor(private api: ApiUrlService) {}

  getActivity(entityType: string, recordId: string | number, params: ChatterQueryParams = {}): Observable<ChatterResponse> {
    const search = new URLSearchParams()
    if (params.page) {
      search.set('page', String(params.page))
    }
    if (params.pageSize) {
      search.set('pageSize', String(params.pageSize))
    }
    if (params.eventType) {
      search.set('eventType', params.eventType)
    }

    const query = search.toString()
    return this.api.get<ApiActivityPage>(`/api/admin/chatter/${entityType}/${recordId}${query ? `?${query}` : ''}`).pipe(
      map(response => ({
        ...response,
        items: response.items.map(item => this.mapItem(item))
      }))
    )
  }

  addMessage(entityType: string, recordId: string | number, message: string): Observable<ChatterItem> {
    return this.api.post<ApiActivityLog>(`/api/admin/chatter/${entityType}/${recordId}/messages`, { message }).pipe(
      map(item => this.mapItem(item))
    )
  }

  private mapItem(item: ApiActivityLog): ChatterItem {
    return {
      id: item.id,
      entityType: item.entity_type,
      recordId: item.record_id,
      eventType: item.event_type,
      message: item.message,
      fieldName: item.field_name,
      oldValue: item.old_value,
      newValue: item.new_value,
      metadata: item.metadata,
      createdBy: {
        id: item.created_by_user_id,
        name: item.created_by_name || 'System'
      },
      createdAt: item.created_at
    }
  }
}
