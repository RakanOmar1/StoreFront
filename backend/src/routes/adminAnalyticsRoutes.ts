import { Router } from 'express'
import { AdminAnalyticsController } from '../analytics/admin-analytics.controller'
import { requireAdmin } from '../middleware/requireAdmin'
import { verifyAuthToken } from '../middleware/verifyAuthToken'

const routes = Router()
const controller = new AdminAnalyticsController()

routes.use(verifyAuthToken, requireAdmin)
routes.get('/revenue', controller.revenue.bind(controller))
routes.get('/orders-by-status', controller.ordersByStatus.bind(controller))
routes.get('/sales-by-category', controller.salesByCategory.bind(controller))
routes.get('/top-products', controller.topProducts.bind(controller))

export default routes
