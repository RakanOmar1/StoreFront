import { Router } from 'express'
import { ProductController } from '../controllers/ProductController'
import { verifyAuthToken } from '../middleware/verifyAuthToken'
import { requireAdmin } from '../middleware/requireAdmin'

const routes = Router()
const controller = new ProductController()

routes.get('/filters', controller.filters)
routes.get('/popular', controller.popularProducts)
routes.get('/', controller.index)
routes.post('/', verifyAuthToken, requireAdmin, controller.create)
routes.get('/:id', controller.show)
routes.put('/:id', verifyAuthToken, requireAdmin, controller.update)
routes.patch('/:id', verifyAuthToken, requireAdmin, controller.update)
routes.delete('/:id', verifyAuthToken, requireAdmin, controller.delete)

export default routes
