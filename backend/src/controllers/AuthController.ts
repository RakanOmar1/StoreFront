import { Request, Response } from 'express'
import { UserModel } from '../models/UserModel'
import { AuthService } from '../services/AuthService'

const model = new UserModel()
const authService = new AuthService()

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      if (!validCredentials(req.body)) {
        res.status(400).json('Firstname, lastname, a contact method, and a password of at least 6 characters are required')
        return
      }
      const user = await model.create({ ...req.body, role: 'CUSTOMER' })
      res.status(201).json({ user, token: authService.generateToken(user) })
    } catch (error) {
      res.status(400).json('Could not create user')
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const identifier = req.body.identifier || req.body.firstname || req.body.email || req.body.phone
      const user = await model.authenticate(identifier, req.body.password)

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

function validCredentials(input: Record<string, unknown>): boolean {
  const email = typeof input?.email === 'string' ? input.email.trim() : ''
  const phone = typeof input?.phone === 'string' ? input.phone.trim() : ''
  return typeof input?.firstname === 'string' && input.firstname.trim().length > 0 &&
    typeof input?.lastname === 'string' && input.lastname.trim().length > 0 &&
    typeof input?.password === 'string' && input.password.length >= 6 &&
    (email.length > 0 || phone.length > 0)
}
