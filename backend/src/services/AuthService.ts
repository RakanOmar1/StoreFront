import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { PublicUser } from '../types/User'

dotenv.config()

export class AuthService {
  private pepper = process.env.BCRYPT_PASSWORD || 'storefront_pepper'
  private saltRounds = Number(process.env.SALT_ROUNDS) || 10
  private tokenSecret = process.env.TOKEN_SECRET || 'storefront_secret'

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
