import { Request, Response } from 'express'
import { OrderModel } from '../models/OrderModel'
import { ActivityLogService } from '../services/ActivityLogService'
import { isPrivileged } from '../middleware/authorizeResourceOwner'
import { isOrderStaff } from '../middleware/requireOrderStaff'

const model = new OrderModel()
const activity = new ActivityLogService()
type AuthRequest = Request & { user?: { id?: number; role?: string } }

export class OrderController {
  async index(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orders = req.user?.role === 'DELIVERY'
        ? await model.indexDeliveries()
        : isOrderStaff(req)
          ? await model.index()
          : await model.indexByUser(req.user?.id as number)
      res.json(orders)
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
      if (!isOrderStaff(req) && Number(order.user_id) !== req.user?.id) {
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

  async updateDelivery(req: AuthRequest, res: Response): Promise<void> {
    try {
      const status = req.body.status as string | undefined
      const paymentStatus = req.body.payment_status as string | undefined
      const allowedStatuses = ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED']
      const allowedPaymentStatuses = ['PENDING', 'PAID']
      if ((status && !allowedStatuses.includes(status)) || (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus))) {
        res.status(400).json('Invalid delivery or payment status')
        return
      }
      if (!status && !paymentStatus) {
        res.status(400).json('A delivery or payment status is required')
        return
      }
      const before = await model.show(req.params.id)
      if (!before) {
        res.status(404).json('Order not found')
        return
      }
      const order = await model.updateDeliveryProgress(req.params.id, status, paymentStatus)
      await activity.logUpdate('ORDER', req.params.id, req.user, before as Record<string, unknown>, order as Record<string, unknown>)
      res.json(order)
    } catch {
      res.status(400).json('Could not update delivery order')
    }
  }

  async cancel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const before = await model.show(req.params.id)
      if (!before) {
        res.status(404).json('Order not found')
        return
      }

      if (!isPrivileged(req) && Number(before.user_id) !== req.user?.id) {
        res.status(403).json('You do not have access to this order')
        return
      }

      const order = await model.cancelByCustomer(req.params.id, Number(before.user_id))
      if (!order) {
        res.status(409).json('This order can no longer be cancelled')
        return
      }

      await activity.logUpdate('ORDER', req.params.id, req.user, before as Record<string, unknown>, order as Record<string, unknown>)
      res.json(order)
    } catch {
      res.status(500).json('Could not cancel order')
    }
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const quantity = Number(req.body.quantity)
      if (!Number.isInteger(quantity) || quantity <= 0) {
        res.status(400).json('A positive quantity is required')
        return
      }
      res.json(await model.updateProduct(req.params.id, req.params.itemId, quantity))
    } catch {
      res.status(404).json('Order item not found')
    }
  }

  async removeProduct(req: Request, res: Response): Promise<void> {
    try {
      res.json(await model.removeProduct(req.params.id, req.params.itemId))
    } catch {
      res.status(404).json('Order item not found')
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
      if (req.body.deliveryType === 'DELIVERY' &&
          (!validLatitude(req.body.deliveryLatitude) || !validLongitude(req.body.deliveryLongitude))) {
        res.status(400).json('A precise delivery location is required')
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

function validLatitude(value: unknown): boolean {
  const coordinate = Number(value)
  return Number.isFinite(coordinate) && coordinate >= -90 && coordinate <= 90
}

function validLongitude(value: unknown): boolean {
  const coordinate = Number(value)
  return Number.isFinite(coordinate) && coordinate >= -180 && coordinate <= 180
}
