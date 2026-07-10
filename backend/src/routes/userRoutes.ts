import { Router } from 'express'
import { UserController } from '../controllers/UserController'
import { optionalAuthToken, verifyAuthToken } from '../middleware/verifyAuthToken'

const routes = Router()
const controller = new UserController()

routes.get('/', verifyAuthToken, controller.index)
routes.get('/:id', verifyAuthToken, controller.show)
routes.post('/', optionalAuthToken, controller.create)
routes.put('/:id', verifyAuthToken, controller.update)
routes.delete('/:id', verifyAuthToken, controller.delete)

export default routes
