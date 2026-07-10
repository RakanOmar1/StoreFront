import { Request, Response } from 'express'
import { UserModel } from '../models/UserModel'
import { AuthService } from '../services/AuthService'
import { ActivityLogService } from '../services/ActivityLogService'

const model = new UserModel()
const authService = new AuthService()
const activity = new ActivityLogService()
type AuthRequest = Request & { user?: { id?: number; role?: string } }

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

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await model.create(req.body)
      await activity.logCreate('USER', user.id as number, req.user, user as Record<string, unknown>)
      res.status(201).json({ user, token: authService.generateToken(user) })
    } catch (error) {
      res.status(400).json('Could not create user')
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const before = await model.show(req.params.id)
      const user = await model.update(req.params.id, req.body)
      if (!user) {
        res.status(404).json('User not found')
        return
      }
      await activity.logUpdate('USER', req.params.id, req.user, before as Record<string, unknown>, user as Record<string, unknown>)
      res.json(user)
    } catch (error) {
      res.status(400).json('Could not update user')
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const before = await model.show(req.params.id)
      const user = await model.delete(req.params.id)
      if (!user) {
        res.status(404).json('User not found')
        return
      }
      await activity.logDelete('USER', req.params.id, req.user, (before || user) as Record<string, unknown>)
      res.json(user)
    } catch (error) {
      res.status(500).json('Could not delete user')
    }
  }
}
