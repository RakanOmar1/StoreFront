import { Request, Response } from 'express'
import { ProductModel } from '../models/ProductModel'

const model = new ProductModel()

export class ProductController {
  async index(req: Request, res: Response): Promise<void> {
    try {
      res.json(await model.index())
    } catch (error) {
      res.status(500).json('Could not get products')
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

  async create(req: Request, res: Response): Promise<void> {
    try {
      res.status(201).json(await model.create(req.body))
    } catch (error) {
      res.status(400).json('Could not create product')
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const product = await model.update(req.params.id, req.body)
      if (!product) {
        res.status(404).json('Product not found')
        return
      }
      res.json(product)
    } catch (error) {
      res.status(400).json('Could not update product')
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const product = await model.delete(req.params.id)
      if (!product) {
        res.status(404).json('Product not found')
        return
      }
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
