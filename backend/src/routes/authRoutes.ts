import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'

const routes = Router()
const controller = new AuthController()

routes.post('/login', controller.login)

export default routes
