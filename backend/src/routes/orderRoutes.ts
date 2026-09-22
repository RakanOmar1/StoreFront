import { Router } from 'express'
import { OrderController } from '../controllers/OrderController'
import { verifyAuthToken } from '../middleware/verifyAuthToken'
import { authorizeResourceOwner } from '../middleware/authorizeResourceOwner'
import { authorizeOrderAccess } from '../middleware/authorizeOrderAccess'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireOrderStaff } from '../middleware/requireOrderStaff'

const routes = Router()
const controller = new OrderController()

routes.get('/', verifyAuthToken, controller.index)
routes.get('/users/:userId/current', verifyAuthToken, authorizeResourceOwner('userId'), controller.currentOrderByUser)
routes.get('/users/:userId/completed', verifyAuthToken, authorizeResourceOwner('userId'), controller.completedOrdersByUser)
routes.get('/:id', verifyAuthToken, authorizeOrderAccess, controller.show)
routes.patch('/:id/cancel', verifyAuthToken, authorizeOrderAccess, controller.cancel)
routes.post('/', verifyAuthToken, requireAdmin, controller.create)
routes.post('/checkout', verifyAuthToken, controller.checkout)
routes.put('/:id', verifyAuthToken, requireAdmin, controller.update)
routes.patch('/:id/delivery', verifyAuthToken, requireOrderStaff, controller.updateDelivery)
routes.delete('/:id', verifyAuthToken, requireAdmin, controller.delete)
routes.post('/:id/products', verifyAuthToken, requireAdmin, controller.addProduct)
routes.patch('/:id/products/:itemId', verifyAuthToken, requireAdmin, controller.updateProduct)
routes.delete('/:id/products/:itemId', verifyAuthToken, requireAdmin, controller.removeProduct)

export default routes
