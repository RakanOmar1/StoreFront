import { Request, Response } from 'express'
import { CategoryModel } from '../models/CategoryModel'
import { ActivityLogService } from '../services/ActivityLogService'

const model = new CategoryModel()
const activity = new ActivityLogService()
type AuthRequest = Request & { user?: { id?: number; role?: string } }

export class CategoryController {
  async index(req: Request, res: Response): Promise<void> {
    try {
      res.json(await model.index())
    } catch {
      res.status(500).json('Could not get categories')
    }
  }

  async show(req: Request, res: Response): Promise<void> {
    try {
      const category = await model.show(req.params.id)
      category ? res.json(category) : res.status(404).json('Category not found')
    } catch {
      res.status(500).json('Could not get category')
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const category = await model.create(req.body)
      await activity.logCreate('CATEGORY', category.id as number, req.user, category as Record<string, unknown>)
      res.status(201).json(category)
    } catch {
      res.status(400).json('Could not create category')
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const before = await model.show(req.params.id)
      const category = await model.update(req.params.id, req.body)
      if (!category) {
        res.status(404).json('Category not found')
        return
      }
      await activity.logUpdate('CATEGORY', req.params.id, req.user, before as Record<string, unknown>, category as Record<string, unknown>)
      res.json(category)
    } catch {
      res.status(400).json('Could not update category')
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const before = await model.show(req.params.id)
      const category = await model.delete(req.params.id)
      if (!category) {
        res.status(404).json('Category not found')
        return
      }
      await activity.logDelete('CATEGORY', req.params.id, req.user, (before || category) as Record<string, unknown>)
      res.json(category)
    } catch (error) {
      res.status(400).json('Could not delete category')
    }
  }
}
