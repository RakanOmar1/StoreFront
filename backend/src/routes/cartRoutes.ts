import { Router } from 'express'
import { CartController } from '../controllers/CartController'
import { verifyAuthToken } from '../middleware/verifyAuthToken'

const routes = Router()
const controller = new CartController()

routes.use(verifyAuthToken)
routes.get('/', controller.getMyCart)
routes.post('/add', controller.addItem)
routes.patch('/update', controller.updateItem)
routes.delete('/remove/:productId', controller.removeItem)

export default routes
