import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../config/database'

const tokenSecret = (): string => {
  if (!process.env.TOKEN_SECRET) throw new Error('TOKEN_SECRET must be configured')
  return process.env.TOKEN_SECRET
}

export const verifyAuthToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const header = req.headers.authorization

    if (!header) {
      res.status(401).json('Access denied')
      return
    }

    const token = header.split(' ')[1] || header
    const decoded = jwt.verify(token, tokenSecret()) as {
      id?: number
      role?: string
      user?: { id?: number; role?: string }
    }

    const id = Number(decoded.id || decoded.user?.id)
    const tokenRole = String(decoded.role || decoded.user?.role || 'CUSTOMER').toUpperCase()
    if (!Number.isInteger(id) || id <= 0) {
      res.status(401).json({ code: 'INVALID_SESSION', message: 'Invalid token' })
      return
    }

    const current = await pool.query(
      'SELECT role, is_active FROM users WHERE id = $1',
      [id]
    )
    const user = current.rows[0] as { role?: string; is_active?: boolean } | undefined
    const currentRole = String(user?.role || 'CUSTOMER').toUpperCase()

    if (!user || user.is_active === false || currentRole !== tokenRole) {
      res.status(401).json({
        code: 'SESSION_STALE',
        message: 'Your account permissions changed. Sign in again.'
      })
      return
    }

    ;(req as Request & { user?: { id?: number; role?: string } }).user = {
      id,
      role: currentRole
    }
    next()
  } catch (error) {
    res.status(401).json({ code: 'INVALID_SESSION', message: 'Invalid token' })
  }
}

export const optionalAuthToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const header = req.headers.authorization

    if (!header) {
      next()
      return
    }

    const token = header.split(' ')[1] || header
    const decoded = jwt.verify(token, tokenSecret()) as {
      id?: number
      role?: string
      user?: { id?: number; role?: string }
    }

    const id = Number(decoded.id || decoded.user?.id)
    const tokenRole = String(decoded.role || decoded.user?.role || 'CUSTOMER').toUpperCase()
    if (!Number.isInteger(id) || id <= 0) {
      res.status(401).json({ code: 'INVALID_SESSION', message: 'Invalid token' })
      return
    }

    const current = await pool.query(
      'SELECT role, is_active FROM users WHERE id = $1',
      [id]
    )
    const user = current.rows[0] as { role?: string; is_active?: boolean } | undefined
    const currentRole = String(user?.role || 'CUSTOMER').toUpperCase()
    if (!user || user.is_active === false || currentRole !== tokenRole) {
      res.status(401).json({
        code: 'SESSION_STALE',
        message: 'Your account permissions changed. Sign in again.'
      })
      return
    }

    ;(req as Request & { user?: { id?: number; role?: string } }).user = {
      id,
      role: currentRole
    }
  } catch (error) {
    res.status(401).json({ code: 'INVALID_SESSION', message: 'Invalid token' })
    return
  }

  next()
}
