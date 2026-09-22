import { Router } from 'express'
import { BrandController } from '../controllers/BrandController'
import { verifyAuthToken } from '../middleware/verifyAuthToken'
import { requireAdmin } from '../middleware/requireAdmin'

const routes = Router()
const controller = new BrandController()
routes.get('/', controller.index)
routes.get('/:id', controller.show)
routes.post('/', verifyAuthToken, requireAdmin, controller.create)
routes.put('/:id', verifyAuthToken, requireAdmin, controller.update)
routes.patch('/:id', verifyAuthToken, requireAdmin, controller.update)
routes.delete('/:id', verifyAuthToken, requireAdmin, controller.delete)
export default routes
