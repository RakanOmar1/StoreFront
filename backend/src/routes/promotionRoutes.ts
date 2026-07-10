import { Router } from 'express'
import { PromotionController } from '../controllers/PromotionController'
import { verifyAuthToken } from '../middleware/verifyAuthToken'

const routes = Router()
const controller = new PromotionController()

routes.get('/', controller.index)
routes.get('/:id/products', controller.products.bind(controller))
routes.get('/:id', controller.show)
routes.post('/', verifyAuthToken, controller.create.bind(controller))
routes.put('/:id', verifyAuthToken, controller.update.bind(controller))
routes.patch('/:id', verifyAuthToken, controller.update.bind(controller))
routes.delete('/:id', verifyAuthToken, controller.delete.bind(controller))

export default routes
