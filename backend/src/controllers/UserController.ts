import { Request, Response } from 'express'
import { UserModel } from '../models/UserModel'
import { AuthService } from '../services/AuthService'

const model = new UserModel()
const authService = new AuthService()

export class UserController {
  async index(req: Request, res: Response): Promise<void> {
    try {
      res.json(await model.index())
    } catch (error) {
      res.status(500).json('Could not get users')
    }
  }

  async show(req: Request, res: Response): Promise<void> {
    try {
      const user = await model.show(req.params.id)
      if (!user) {
        res.status(404).json('User not found')
        return
      }
      res.json(user)
    } catch (error) {
      res.status(500).json('Could not get user')
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = await model.create(req.body)
      res.status(201).json({ user, token: authService.generateToken(user) })
    } catch (error) {
      res.status(400).json('Could not create user')
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const user = await model.update(req.params.id, req.body)
      if (!user) {
        res.status(404).json('User not found')
        return
      }
      res.json(user)
    } catch (error) {
      res.status(400).json('Could not update user')
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const user = await model.delete(req.params.id)
      if (!user) {
        res.status(404).json('User not found')
        return
      }
      res.json(user)
    } catch (error) {
      res.status(500).json('Could not delete user')
    }
  }
}
