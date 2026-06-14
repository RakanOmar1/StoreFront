import { Request, Response } from 'express'
import { UserModel } from '../models/UserModel'
import { AuthService } from '../services/AuthService'

const model = new UserModel()
const authService = new AuthService()

export class AuthController {
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
}
