import { Router } from 'express'
import { OrderController } from '../controllers/OrderController'
import { verifyAuthToken } from '../middleware/verifyAuthToken'

const routes = Router()
const controller = new OrderController()

routes.get('/', verifyAuthToken, controller.index)
routes.get('/users/:userId/current', verifyAuthToken, controller.currentOrderByUser)
routes.get('/users/:userId/completed', verifyAuthToken, controller.completedOrdersByUser)
routes.get('/:id', verifyAuthToken, controller.show)
routes.post('/', verifyAuthToken, controller.create)
routes.put('/:id', verifyAuthToken, controller.update)
routes.delete('/:id', verifyAuthToken, controller.delete)
routes.post('/:id/products', verifyAuthToken, controller.addProduct)

export default routes
