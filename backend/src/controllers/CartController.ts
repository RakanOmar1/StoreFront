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
      const productId = positiveInteger(req.body.productId || req.body.product_id)
      const quantity = positiveInteger(req.body.quantity ?? 1)
      if (!productId || !quantity) {
        res.status(400).json('A valid product and positive quantity are required')
        return
      }
      res.json(await model.addItem(req.user?.id as number, productId, quantity))
    } catch {
      res.status(400).json('Could not add item to cart')
    }
  }

  async syncItems(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!Array.isArray(req.body?.items)) {
        res.status(400).json('An items array is required')
        return
      }

      const seen = new Set<number>()
      const items: Array<{ productId: number; quantity: number }> = []

      for (const input of req.body.items) {
        const productId = positiveInteger(input?.productId ?? input?.product_id)
        const quantity = positiveInteger(input?.quantity)

        if (!productId || !quantity || quantity > 99 || seen.has(productId)) {
          res.status(400).json('Each item requires a unique valid product and quantity from 1 to 99')
          return
        }

        seen.add(productId)
        items.push({ productId, quantity })
      }

      res.json(await model.syncItems(req.user?.id as number, items))
    } catch {
      res.status(400).json('Could not synchronize cart')
    }
  }

  async updateItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const productId = positiveInteger(req.body.productId || req.body.product_id)
      const quantity = Number(req.body.quantity)
      if (!productId || !Number.isInteger(quantity)) {
        res.status(400).json('A valid product and integer quantity are required')
        return
      }
      const item = await model.updateItem(req.user?.id as number, productId, quantity)
      if (!item) {
        res.status(404).json('Cart item not found')
        return
      }
      res.json(item)
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

function positiveInteger(value: unknown): number | null {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}
