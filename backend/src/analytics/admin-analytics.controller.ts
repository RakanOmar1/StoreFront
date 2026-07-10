import { Request, Response } from 'express'
import { AdminAnalyticsService, AnalyticsValidationError } from './admin-analytics.service'

const service = new AdminAnalyticsService()

export class AdminAnalyticsController {
  async revenue(req: Request, res: Response): Promise<void> {
    try {
      res.json(await service.revenue(this.queryValue(req.query.period)))
    } catch (error) {
      this.handleError(error, res)
    }
  }

  async ordersByStatus(req: Request, res: Response): Promise<void> {
    try {
      res.json(await service.ordersByStatus())
    } catch (error) {
      this.handleError(error, res)
    }
  }

  async salesByCategory(req: Request, res: Response): Promise<void> {
    try {
      res.json(await service.salesByCategory(this.queryValue(req.query.period), this.queryValue(req.query.limit)))
    } catch (error) {
      this.handleError(error, res)
    }
  }

  async topProducts(req: Request, res: Response): Promise<void> {
    try {
      res.json(await service.topProducts(this.queryValue(req.query.period), this.queryValue(req.query.limit)))
    } catch (error) {
      this.handleError(error, res)
    }
  }

  private queryValue(value: unknown): string | undefined {
    return Array.isArray(value) ? String(value[0]) : value ? String(value) : undefined
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof AnalyticsValidationError) {
      res.status(400).json(error.message)
      return
    }

    res.status(500).json('Could not load analytics data')
  }
}
