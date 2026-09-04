import { NextFunction, Request, Response } from 'express'
import pool from '../config/database'
import { isPrivileged } from './authorizeResourceOwner'

type AuthRequest = Request & { user?: { id?: number; role?: string } }

export const authorizeOrderAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (isPrivileged(req)) {
      next()
      return
    }

    const result = await pool.query('SELECT user_id FROM orders WHERE id = $1', [req.params.id])
    if (!result.rows[0]) {
      next()
      return
    }
    if (Number(result.rows[0].user_id) !== req.user?.id) {
      res.status(403).json('You do not have access to this order')
      return
    }
    next()
  } catch {
    res.status(500).json('Could not authorize order access')
  }
}
