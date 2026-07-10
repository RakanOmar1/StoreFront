import { Router } from 'express'
import { CategoryController } from '../controllers/CategoryController'
import { verifyAuthToken } from '../middleware/verifyAuthToken'

const routes = Router()
const controller = new CategoryController()

routes.get('/', controller.index)
routes.get('/:id', controller.show)
routes.post('/', verifyAuthToken, controller.create)
routes.put('/:id', verifyAuthToken, controller.update)
routes.patch('/:id', verifyAuthToken, controller.update)
routes.delete('/:id', verifyAuthToken, controller.delete)

export default routes
