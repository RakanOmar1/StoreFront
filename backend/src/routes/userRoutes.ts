import { Router } from 'express'
import { UserController } from '../controllers/UserController'
import { optionalAuthToken, verifyAuthToken } from '../middleware/verifyAuthToken'
import { requireAdmin } from '../middleware/requireAdmin'

const routes = Router()
const controller = new UserController()

routes.get('/', verifyAuthToken, requireAdmin, controller.index)
routes.get('/:id', verifyAuthToken, requireAdmin, controller.show)
routes.post('/', optionalAuthToken, controller.create)
routes.put('/:id', verifyAuthToken, requireAdmin, controller.update)
routes.delete('/:id', verifyAuthToken, requireAdmin, controller.delete)

export default routes
