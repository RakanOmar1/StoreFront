import { Router } from 'express'
import { ProductController } from '../controllers/ProductController'
import { verifyAuthToken } from '../middleware/verifyAuthToken'

const routes = Router()
const controller = new ProductController()

routes.get('/', controller.index)
routes.get('/popular', controller.popularProducts)
routes.post('/', verifyAuthToken, controller.create)
routes.get('/:id', controller.show)
routes.put('/:id', verifyAuthToken, controller.update)
routes.delete('/:id', verifyAuthToken, controller.delete)

export default routes
