import { Router } from 'express'
import { PromotionController } from '../controllers/PromotionController'
import { verifyAuthToken } from '../middleware/verifyAuthToken'
import { requireAdmin } from '../middleware/requireAdmin'

const routes = Router()
const controller = new PromotionController()

routes.get('/', controller.index)
routes.get('/:id/products', controller.products.bind(controller))
routes.get('/:id', controller.show)
routes.post('/', verifyAuthToken, requireAdmin, controller.create.bind(controller))
routes.put('/:id', verifyAuthToken, requireAdmin, controller.update.bind(controller))
routes.patch('/:id', verifyAuthToken, requireAdmin, controller.update.bind(controller))
routes.delete('/:id', verifyAuthToken, requireAdmin, controller.delete.bind(controller))

export default routes
