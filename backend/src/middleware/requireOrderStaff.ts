import { NextFunction, Request, Response } from 'express'

type AuthRequest = Request & { user?: { id?: number; role?: string } }

export const isOrderStaff = (req: AuthRequest): boolean =>
  req.user?.role === 'ADMIN' || req.user?.role === 'MANAGER' || req.user?.role === 'DELIVERY'

export const requireOrderStaff = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json('Access denied')
    return
  }
  if (!isOrderStaff(req)) {
    res.status(403).json('Order staff access required')
    return
  }
  next()
}
