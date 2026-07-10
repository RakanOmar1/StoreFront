import pool from '../config/database'
import { AuthService } from '../services/AuthService'
import { PublicUser, User } from '../types/User'

export class UserModel {
  private authService = new AuthService()

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name || `${user.firstname} ${user.lastname}`.trim(),
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone,
      role: user.role || 'CUSTOMER',
      is_active: user.is_active ?? true,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  }

  async index(): Promise<PublicUser[]> {
    const result = await pool.query('SELECT id, name, firstname, lastname, email, phone, role, is_active, created_at, updated_at FROM users ORDER BY id')
    return result.rows
  }

  async show(id: string): Promise<PublicUser> {
    const result = await pool.query(
      'SELECT id, name, firstname, lastname, email, phone, role, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    )
    return result.rows[0]
  }

  async create(user: User): Promise<PublicUser> {
    const passwordDigest = this.authService.hashPassword(user.password || '')
    const firstname = user.firstname || user.name?.split(' ')[0] || ''
    const lastname = user.lastname || user.name?.split(' ').slice(1).join(' ') || firstname
    const name = user.name || `${firstname} ${lastname}`.trim()

    const result = await pool.query(
      `INSERT INTO users (name, firstname, lastname, email, phone, role, password_digest)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, firstname, lastname, email, phone, role, is_active, created_at, updated_at`,
      [name, firstname, lastname, user.email || null, user.phone || null, user.role || 'CUSTOMER', passwordDigest]
    )
    return result.rows[0]
  }

  async authenticate(identifier: string, password: string): Promise<PublicUser | null> {
    const normalizedIdentifier = String(identifier || '').trim()

    if (!normalizedIdentifier || !password) {
      return null
    }

    const result = await pool.query(
      `SELECT * FROM users
       WHERE LOWER(firstname) = LOWER($1)
          OR LOWER(COALESCE(name, '')) = LOWER($1)
          OR LOWER(COALESCE(email, '')) = LOWER($1)
          OR phone = $1
       ORDER BY CASE WHEN role IN ('ADMIN', 'MANAGER') THEN 0 ELSE 1 END, id DESC
       LIMIT 1`,
      [normalizedIdentifier]
    )
    const user = result.rows[0] as User | undefined

    if (!user || !user.password_digest || user.is_active === false) {
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
    const firstname = user.firstname || user.name?.split(' ')[0] || ''
    const lastname = user.lastname || user.name?.split(' ').slice(1).join(' ') || firstname
    const name = user.name || `${firstname} ${lastname}`.trim()

    if (passwordDigest) {
      const result = await pool.query(
        `UPDATE users
         SET name = $1, firstname = $2, lastname = $3, email = $4, phone = $5, role = COALESCE($6, role), password_digest = $7, updated_at = NOW()
         WHERE id = $8
         RETURNING id, name, firstname, lastname, email, phone, role, is_active, created_at, updated_at`,
        [name, firstname, lastname, user.email || null, user.phone || null, user.role, passwordDigest, id]
      )
      return result.rows[0]
    }

    const result = await pool.query(
      `UPDATE users
       SET name = $1, firstname = $2, lastname = $3, email = $4, phone = $5, role = COALESCE($6, role), updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, firstname, lastname, email, phone, role, is_active, created_at, updated_at`,
      [name, firstname, lastname, user.email || null, user.phone || null, user.role, id]
    )
    return result.rows[0]
  }

  async delete(id: string): Promise<PublicUser> {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, name, firstname, lastname, email, phone, role, is_active, created_at, updated_at',
      [id]
    )
    return result.rows[0]
  }
}
