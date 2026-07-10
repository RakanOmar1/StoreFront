import { Router } from 'express'
import { ActivityLogController } from '../controllers/ActivityLogController'
import { requireAdmin } from '../middleware/requireAdmin'
import { verifyAuthToken } from '../middleware/verifyAuthToken'

const routes = Router()
const controller = new ActivityLogController()

routes.get('/', verifyAuthToken, requireAdmin, controller.all)
routes.get('/:entityType/:recordId', verifyAuthToken, requireAdmin, controller.index)
routes.post('/:entityType/:recordId/messages', verifyAuthToken, requireAdmin, controller.createMessage)

export default routes
