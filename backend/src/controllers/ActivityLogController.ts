import { Request, Response } from 'express'
import { ActivityEventType } from '../types/ActivityLog'
import { ActivityLogService } from '../services/ActivityLogService'

type AuthRequest = Request & { user?: { id?: number; role?: string } }

const service = new ActivityLogService()

export class ActivityLogController {
  async index(req: Request, res: Response): Promise<void> {
    try {
      res.json(await service.getActivity(req.params.entityType, req.params.recordId, {
        page: optionalNumber(req.query.page),
        pageSize: optionalNumber(req.query.pageSize),
        eventType: optionalEventType(req.query.eventType)
      }))
    } catch (error) {
      res.status(500).json('Could not get activity')
    }
  }

  async all(req: Request, res: Response): Promise<void> {
    try {
      res.json(await service.getAllActivity({
        page: optionalNumber(req.query.page),
        pageSize: optionalNumber(req.query.pageSize),
        eventType: optionalEventType(req.query.eventType),
        entityType: optionalString(req.query.entityType),
        recordId: optionalString(req.query.recordId),
        search: optionalString(req.query.search)
      }))
    } catch (error) {
      res.status(500).json('Could not get activity')
    }
  }

  async createMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const item = await service.addComment(req.params.entityType, req.params.recordId, req.user, req.body.message)
      res.status(201).json(item)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      res.status(message === 'Record not found' ? 404 : 400).json(message || 'Could not add activity message')
    }
  }
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined
  }

  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : undefined
}

function optionalEventType(value: unknown): ActivityEventType | undefined {
  const eventType = optionalString(value)
  const allowed = new Set(['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'COMMENT', 'SYSTEM'])
  return eventType && allowed.has(eventType) ? eventType as ActivityEventType : undefined
}
