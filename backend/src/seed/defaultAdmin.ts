import pool from '../config/database'
import { AuthService } from '../services/AuthService'

const authService = new AuthService()

export const ensureDefaultAdmin = async (): Promise<void> => {
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS name VARCHAR(200),
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS address VARCHAR(500),
      ADD COLUMN IF NOT EXISTS city VARCHAR(120),
      ADD COLUMN IF NOT EXISTS avatar_url TEXT,
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
  `)

  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) return
  const existing = await pool.query(
    `SELECT id FROM users
     WHERE LOWER(COALESCE(email, '')) = LOWER($1)
     ORDER BY id
     LIMIT 1`
  , [adminEmail])

  if (existing.rows[0]) {
    return
  }

  const passwordDigest = authService.hashPassword(adminPassword)
  await pool.query(
    `INSERT INTO users (name, firstname, lastname, email, role, is_active, password_digest)
     VALUES ('admin', 'admin', 'admin', $1, 'ADMIN', TRUE, $2)`,
    [adminEmail, passwordDigest]
  )
}
