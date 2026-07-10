import { Request, Response } from 'express'
import { CartModel } from '../models/CartModel'

const model = new CartModel()

type AuthRequest = Request & { user?: { id?: number } }

export class CartController {
  async getMyCart(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json(await model.getCart(req.user?.id as number))
    } catch {
      res.status(400).json('Could not get cart')
    }
  }

  async addItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json(await model.addItem(req.user?.id as number, req.body.productId || req.body.product_id, req.body.quantity))
    } catch {
      res.status(400).json('Could not add item to cart')
    }
  }

  async updateItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json(await model.updateItem(req.user?.id as number, req.body.productId || req.body.product_id, Number(req.body.quantity)))
    } catch {
      res.status(400).json('Could not update cart item')
    }
  }

  async removeItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json(await model.removeItem(req.user?.id as number, req.params.productId))
    } catch {
      res.status(400).json('Could not remove cart item')
    }
  }
}
