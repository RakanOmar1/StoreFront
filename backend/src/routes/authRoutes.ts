import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { verifyAuthToken } from '../middleware/verifyAuthToken'

const routes = Router()
const controller = new AuthController()

routes.post('/register', controller.register)
routes.post('/login', controller.login)
routes.post('/logout', verifyAuthToken, controller.logout)

export default routes
