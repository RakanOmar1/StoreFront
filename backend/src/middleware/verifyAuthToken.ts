import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export const verifyAuthToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const header = req.headers.authorization

    if (!header) {
      res.status(401).json('Access denied')
      return
    }

    const token = header.split(' ')[1] || header
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET || 'storefront_secret') as {
      id?: number
      role?: string
      user?: { id?: number; role?: string }
    }

    ;(req as Request & { user?: { id?: number; role?: string } }).user = {
      id: decoded.id || decoded.user?.id,
      role: decoded.role || decoded.user?.role || 'CUSTOMER'
    }
    next()
  } catch (error) {
    res.status(401).json('Invalid token')
  }
}

export const optionalAuthToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const header = req.headers.authorization

    if (!header) {
      next()
      return
    }

    const token = header.split(' ')[1] || header
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET || 'storefront_secret') as {
      id?: number
      role?: string
      user?: { id?: number; role?: string }
    }

    ;(req as Request & { user?: { id?: number; role?: string } }).user = {
      id: decoded.id || decoded.user?.id,
      role: decoded.role || decoded.user?.role || 'CUSTOMER'
    }
  } catch (error) {
    // Optional authentication intentionally ignores invalid tokens to preserve public signup.
  }

  next()
}
