import { NextFunction, Request, Response } from 'express'

type AuthRequest = Request & { user?: { id?: number; role?: string } }

export const isPrivileged = (req: AuthRequest): boolean =>
  req.user?.role === 'ADMIN' || req.user?.role === 'MANAGER'

export const authorizeResourceOwner = (parameter = 'id') =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    const requestedId = Number(req.params[parameter])

    if (isPrivileged(req) || (Number.isInteger(requestedId) && requestedId === req.user?.id)) {
      next()
      return
    }

    res.status(403).json('You do not have access to this resource')
  }
