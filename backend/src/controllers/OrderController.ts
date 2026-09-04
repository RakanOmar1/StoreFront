import { Request, Response } from 'express'
import { OrderModel } from '../models/OrderModel'
import { ActivityLogService } from '../services/ActivityLogService'
import { isPrivileged } from '../middleware/authorizeResourceOwner'

const model = new OrderModel()
const activity = new ActivityLogService()
type AuthRequest = Request & { user?: { id?: number; role?: string } }

export class OrderController {
  async index(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json(isPrivileged(req) ? await model.index() : await model.indexByUser(req.user?.id as number))
    } catch (error) {
      res.status(500).json('Could not get orders')
    }
  }

  async show(req: AuthRequest, res: Response): Promise<void> {
    try {
      const order = await model.show(req.params.id)
      if (!order) {
        res.status(404).json('Order not found')
        return
      }
      if (!isPrivileged(req) && Number(order.user_id) !== req.user?.id) {
        res.status(403).json('You do not have access to this order')
        return
      }
      res.json(order)
    } catch (error) {
      res.status(500).json('Could not get order')
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const order = await model.create({ ...req.body, user_id: isPrivileged(req) ? req.body.user_id : req.user?.id })
      await activity.logCreate('ORDER', order.id as number, (req as AuthRequest).user, order as Record<string, unknown>)
      res.status(201).json(order)
    } catch (error) {
      res.status(400).json('Could not create order')
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const before = await model.show(req.params.id)
      const input = isPrivileged(req) ? req.body : { ...req.body, user_id: before?.user_id }
      const order = await model.update(req.params.id, input)
      if (!order) {
        res.status(404).json('Order not found')
        return
      }
      await activity.logUpdate('ORDER', req.params.id, (req as AuthRequest).user, before as Record<string, unknown>, order as Record<string, unknown>)
      res.json(order)
    } catch (error) {
      res.status(400).json('Could not update order')
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const before = await model.show(req.params.id)
      const order = await model.delete(req.params.id)
      if (!order) {
        res.status(404).json('Order not found')
        return
      }
      await activity.logDelete('ORDER', req.params.id, (req as AuthRequest).user, (before || order) as Record<string, unknown>)
      res.json(order)
    } catch (error) {
      res.status(500).json('Could not delete order')
    }
  }

  async addProduct(req: Request, res: Response): Promise<void> {
    try {
      const productId = Number(req.body.product_id)
      const quantity = Number(req.body.quantity)
      if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
        res.status(400).json('A valid product and positive quantity are required')
        return
      }
      const product = await model.addProduct(
        req.params.id,
        String(productId),
        quantity
      )
      res.status(201).json(product)
    } catch (error) {
      res.status(400).json('Could not add product')
    }
  }

  async currentOrderByUser(req: Request, res: Response): Promise<void> {
    try {
      res.json(await model.currentOrderByUser(req.params.userId))
    } catch (error) {
      res.status(500).json('Could not get current order')
    }
  }

  async completedOrdersByUser(req: Request, res: Response): Promise<void> {
    try {
      res.json(await model.completedOrdersByUser(req.params.userId))
    } catch (error) {
      res.status(500).json('Could not get completed orders')
    }
  }

  async checkout(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!['CASH', 'ONLINE'].includes(req.body.paymentMethod) || !['PICKUP', 'DELIVERY'].includes(req.body.deliveryType)) {
        res.status(400).json('Invalid payment method or delivery type')
        return
      }
      const result = await model.checkout(req.user?.id as number, req.body)
      await activity.logCreate('ORDER', result.order.id as number, req.user, result.order as Record<string, unknown>)
      res.status(201).json(result)
    } catch (error) {
      res.status(400).json('Could not checkout order')
    }
  }
}
