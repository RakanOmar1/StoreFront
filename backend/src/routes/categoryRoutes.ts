import { Router } from 'express'
import { CategoryController } from '../controllers/CategoryController'
import { verifyAuthToken } from '../middleware/verifyAuthToken'
import { requireAdmin } from '../middleware/requireAdmin'

const routes = Router()
const controller = new CategoryController()

routes.get('/', controller.index)
routes.get('/:id', controller.show)
routes.post('/', verifyAuthToken, requireAdmin, controller.create)
routes.put('/:id', verifyAuthToken, requireAdmin, controller.update)
routes.patch('/:id', verifyAuthToken, requireAdmin, controller.update)
routes.delete('/:id', verifyAuthToken, requireAdmin, controller.delete)

export default routes
