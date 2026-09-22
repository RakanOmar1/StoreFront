import { Request, Response } from 'express'
import { BrandModel } from '../models/BrandModel'
import { ActivityLogService } from '../services/ActivityLogService'

const model = new BrandModel()
const activity = new ActivityLogService()
type AuthRequest = Request & { user?: { id?: number; role?: string } }

export class BrandController {
  async index(_req: Request, res: Response): Promise<void> {
    try { res.json(await model.index()) } catch { res.status(500).json('Could not get brands') }
  }
  async show(req: Request, res: Response): Promise<void> {
    try { const brand = await model.show(req.params.id); brand ? res.json(brand) : res.status(404).json('Brand not found') } catch { res.status(500).json('Could not get brand') }
  }
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!String(req.body.name || '').trim()) { res.status(400).json('Brand name is required'); return }
      const brand = await model.create(req.body)
      await activity.logCreate('BRAND', brand.id as number, req.user, brand as Record<string, unknown>)
      res.status(201).json(brand)
    } catch { res.status(400).json('Could not create brand') }
  }
  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!String(req.body.name || '').trim()) { res.status(400).json('Brand name is required'); return }
      const before = await model.show(req.params.id)
      const brand = await model.update(req.params.id, req.body)
      if (!brand) { res.status(404).json('Brand not found'); return }
      await activity.logUpdate('BRAND', req.params.id, req.user, before as Record<string, unknown>, brand as Record<string, unknown>)
      res.json(brand)
    } catch { res.status(400).json('Could not update brand') }
  }
  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const before = await model.show(req.params.id)
      const brand = await model.delete(req.params.id)
      if (!brand) { res.status(404).json('Brand not found'); return }
      await activity.logDelete('BRAND', req.params.id, req.user, (before || brand) as Record<string, unknown>)
      res.json(brand)
    } catch { res.status(400).json('Could not delete brand while products use it') }
  }
}
