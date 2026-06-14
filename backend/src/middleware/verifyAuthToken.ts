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
    jwt.verify(token, process.env.TOKEN_SECRET || 'storefront_secret')
    next()
  } catch (error) {
    res.status(401).json('Invalid token')
  }
}
