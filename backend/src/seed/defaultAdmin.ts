import pool from '../config/database'
import { AuthService } from '../services/AuthService'

const authService = new AuthService()

export const ensureDefaultAdmin = async (): Promise<void> => {
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS name VARCHAR(200),
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
  `)

  const passwordDigest = authService.hashPassword('000000')

  await pool.query(
    `UPDATE users
     SET name = 'admin',
         firstname = 'admin',
         lastname = 'admin',
         email = COALESCE(email, 'admin@solestreet.local'),
         role = 'ADMIN',
         is_active = TRUE,
         password_digest = $1,
         updated_at = NOW()
     WHERE LOWER(firstname) = 'admin'
        OR LOWER(COALESCE(name, '')) = 'admin'
        OR LOWER(COALESCE(email, '')) = 'admin@solestreet.local'`,
    [passwordDigest]
  )

  const existing = await pool.query(
    `SELECT id FROM users
     WHERE LOWER(firstname) = 'admin'
        OR LOWER(COALESCE(name, '')) = 'admin'
        OR LOWER(COALESCE(email, '')) = 'admin@solestreet.local'
     ORDER BY id
     LIMIT 1`
  )

  if (existing.rows[0]) {
    return
  }

  await pool.query(
    `INSERT INTO users (name, firstname, lastname, email, role, is_active, password_digest)
     VALUES ('admin', 'admin', 'admin', 'admin@solestreet.local', 'ADMIN', TRUE, $1)`,
    [passwordDigest]
  )
}
