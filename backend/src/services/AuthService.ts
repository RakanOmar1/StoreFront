import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { PublicUser } from '../types/User'

dotenv.config()

export class AuthService {
  private pepper = requiredSecret('BCRYPT_PASSWORD')
  private saltRounds = Number(process.env.SALT_ROUNDS) || 10
  private tokenSecret = requiredSecret('TOKEN_SECRET')

  hashPassword(password: string): string {
    return bcrypt.hashSync(password + this.pepper, this.saltRounds)
  }

  comparePassword(password: string, passwordDigest: string): boolean {
    return bcrypt.compareSync(password + this.pepper, passwordDigest)
  }

  generateToken(user: PublicUser): string {
    return jwt.sign({ id: user.id, role: user.role || 'CUSTOMER', user }, this.tokenSecret, { expiresIn: '7d' })
  }
}

function requiredSecret(name: 'BCRYPT_PASSWORD' | 'TOKEN_SECRET'): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} must be configured`)
  return value
}
