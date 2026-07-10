import { Request, Response } from 'express'
import { PromotionModel } from '../models/PromotionModel'
import { ActivityLogService } from '../services/ActivityLogService'

const model = new PromotionModel()
const activity = new ActivityLogService()
type AuthRequest = Request & { user?: { id?: number; role?: string } }

export class PromotionController {
  async index(req: Request, res: Response): Promise<void> {
    try {
      res.json(await model.index())
    } catch {
      res.status(500).json('Could not get promotions')
    }
  }

  async show(req: Request, res: Response): Promise<void> {
    try {
      const promotion = await model.show(req.params.id)
      promotion ? res.json(promotion) : res.status(404).json('Promotion not found')
    } catch {
      res.status(500).json('Could not get promotion')
    }
  }

  async products(req: Request, res: Response): Promise<void> {
    try {
      res.json(await model.products(req.params.id))
    } catch {
      res.status(500).json('Could not get promotion products')
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const promotion = await model.create(req.body)
      await activity.logCreate('PROMOTION', promotion.id as number, req.user, promotion as Record<string, unknown>)
      await this.logProductChanges(promotion.id as number, promotion.name, [], promotion.products || [], req.user)
      res.status(201).json(promotion)
    } catch {
      res.status(400).json('Could not create promotion')
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const before = await model.show(req.params.id)
      const promotion = await model.update(req.params.id, req.body)
      if (!promotion) {
        res.status(404).json('Promotion not found')
        return
      }
      await activity.logUpdate('PROMOTION', req.params.id, req.user, before as Record<string, unknown>, promotion as Record<string, unknown>)
      await this.logProductChanges(Number(req.params.id), promotion.name, before?.products || [], promotion.products || [], req.user)
      res.json(promotion)
    } catch {
      res.status(400).json('Could not update promotion')
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const before = await model.show(req.params.id)
      const promotion = await model.delete(req.params.id)
      if (!promotion) {
        res.status(404).json('Promotion not found')
        return
      }
      await activity.logDelete('PROMOTION', req.params.id, req.user, (before || promotion) as Record<string, unknown>)
      res.json(promotion)
    } catch {
      res.status(400).json('Could not delete promotion')
    }
  }

  private async logProductChanges(
    promotionId: number,
    promotionName: string,
    beforeProducts: Array<{ id: number; name: string }>,
    afterProducts: Array<{ id: number; name: string }>,
    actor?: { id?: number; role?: string }
  ): Promise<void> {
    const before = new Map(beforeProducts.map(product => [Number(product.id), product.name]))
    const after = new Map(afterProducts.map(product => [Number(product.id), product.name]))

    for (const [id, name] of after) {
      if (!before.has(id)) {
        await activity.logRelationshipChange('PROMOTION', promotionId, actor, `Added ${name} to ${promotionName}`)
      }
    }

    for (const [id, name] of before) {
      if (!after.has(id)) {
        await activity.logRelationshipChange('PROMOTION', promotionId, actor, `Removed ${name} from ${promotionName}`)
      }
    }
  }
}
