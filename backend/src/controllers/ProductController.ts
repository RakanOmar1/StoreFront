import { Request, Response } from 'express'
import { ProductModel } from '../models/ProductModel'
import { ActivityLogService } from '../services/ActivityLogService'

const model = new ProductModel()
const activity = new ActivityLogService()
type AuthRequest = Request & { user?: { id?: number; role?: string } }

export class ProductController {
  async index(req: Request, res: Response): Promise<void> {
    try {
      res.json(await model.index({
        search: optionalString(req.query.search),
        category: optionalCategory(req.query.category),
        maxPrice: optionalNumber(req.query.maxPrice),
        limit: optionalNumber(req.query.limit, 100),
        offset: optionalNumber(req.query.offset)
      }))
    } catch (error) {
      res.status(500).json('Could not get products')
    }
  }

  async filters(req: Request, res: Response): Promise<void> {
    try {
      res.json(await model.filters())
    } catch (error) {
      res.status(500).json('Could not get product filters')
    }
  }

  async show(req: Request, res: Response): Promise<void> {
    try {
      const product = await model.show(req.params.id)
      if (!product) {
        res.status(404).json('Product not found')
        return
      }
      res.json(product)
    } catch (error) {
      res.status(500).json('Could not get product')
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const product = await model.create(req.body)
      await activity.logCreate('PRODUCT', product.id as number, req.user, product as Record<string, unknown>)
      res.status(201).json(product)
    } catch (error) {
      res.status(400).json('Could not create product')
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const before = await model.show(req.params.id)
      const product = await model.update(req.params.id, req.body)
      if (!product) {
        res.status(404).json('Product not found')
        return
      }
      await activity.logUpdate('PRODUCT', req.params.id, req.user, before as Record<string, unknown>, product as Record<string, unknown>)
      res.json(product)
    } catch (error) {
      res.status(400).json('Could not update product')
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const before = await model.show(req.params.id)
      const product = await model.delete(req.params.id)
      if (!product) {
        res.status(404).json('Product not found')
        return
      }
      await activity.logDelete('PRODUCT', req.params.id, req.user, (before || product) as Record<string, unknown>)
      res.json(product)
    } catch (error) {
      res.status(500).json('Could not delete product')
    }
  }

  async popularProducts(req: Request, res: Response): Promise<void> {
    try {
      res.json(await model.popularProducts())
    } catch (error) {
      res.status(500).json('Could not get popular products')
    }
  }
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function optionalCategory(value: unknown): string | undefined {
  const category = optionalString(value)
  return category && category !== 'all' ? category : undefined
}

function optionalNumber(value: unknown, max?: number): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined
  }

  const number = Number(value)

  if (!Number.isFinite(number) || number < 0) {
    return undefined
  }

  return typeof max === 'number' ? Math.min(Math.floor(number), max) : Math.floor(number)
}
