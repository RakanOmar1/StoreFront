import { Request, Response } from 'express'
import { UserModel } from '../models/UserModel'
import { AuthService } from '../services/AuthService'

const model = new UserModel()
const authService = new AuthService()

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const user = await model.create(req.body)
      res.status(201).json({ user, token: authService.generateToken(user) })
    } catch (error) {
      res.status(400).json('Could not create user')
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const user = await model.authenticate(req.body.firstname, req.body.password)

      if (!user) {
        res.status(401).json('Invalid credentials')
        return
      }

      res.json({ user, token: authService.generateToken(user) })
    } catch (error) {
      res.status(401).json('Invalid credentials')
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    res.json({ message: 'Logged out' })
  }
}
