import { NextFunction, Request, Response } from 'express'

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as Request & { user?: { id?: number; role?: string } }).user

  if (!user) {
    res.status(401).json('Access denied')
    return
  }

  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    res.status(403).json('Admin access required')
    return
  }

  next()
}
