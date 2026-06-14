import pool from '../config/database'
import { AuthService } from '../services/AuthService'
import { PublicUser, User } from '../types/User'

export class UserModel {
  private authService = new AuthService()

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname
    }
  }

  async index(): Promise<PublicUser[]> {
    const result = await pool.query('SELECT id, firstname, lastname FROM users ORDER BY id')
    return result.rows
  }

  async show(id: string): Promise<PublicUser> {
    const result = await pool.query(
      'SELECT id, firstname, lastname FROM users WHERE id = $1',
      [id]
    )
    return result.rows[0]
  }

  async create(user: User): Promise<PublicUser> {
    const passwordDigest = this.authService.hashPassword(user.password || '')
    const result = await pool.query(
      'INSERT INTO users (firstname, lastname, password_digest) VALUES ($1, $2, $3) RETURNING id, firstname, lastname',
      [user.firstname, user.lastname, passwordDigest]
    )
    return result.rows[0]
  }

  async authenticate(firstname: string, password: string): Promise<PublicUser | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE firstname = $1',
      [firstname]
    )
    const user = result.rows[0] as User | undefined

    if (!user || !user.password_digest) {
      return null
    }

    if (!this.authService.comparePassword(password, user.password_digest)) {
      return null
    }

    return this.toPublicUser(user)
  }

  async update(id: string, user: User): Promise<PublicUser> {
    const passwordDigest = user.password
      ? this.authService.hashPassword(user.password)
      : undefined

    if (passwordDigest) {
      const result = await pool.query(
        'UPDATE users SET firstname = $1, lastname = $2, password_digest = $3 WHERE id = $4 RETURNING id, firstname, lastname',
        [user.firstname, user.lastname, passwordDigest, id]
      )
      return result.rows[0]
    }

    const result = await pool.query(
      'UPDATE users SET firstname = $1, lastname = $2 WHERE id = $3 RETURNING id, firstname, lastname',
      [user.firstname, user.lastname, id]
    )
    return result.rows[0]
  }

  async delete(id: string): Promise<PublicUser> {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, firstname, lastname',
      [id]
    )
    return result.rows[0]
  }
}
