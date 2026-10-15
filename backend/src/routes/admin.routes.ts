import { Router } from 'express'
import { listBoardsForAdmin, postTransferOwnership } from '../controllers/admin.controller'
import { authenticate } from '../middleware/authenticate'
import { requireAdmin } from '../middleware/requireAdmin'
import { validate } from '../middleware/validate'
import { adminBoardParamsSchema, transferOwnershipSchema } from '../validators/admin.validators'

export const adminRouter = Router()

adminRouter.use(authenticate, requireAdmin)

adminRouter.get('/boards', listBoardsForAdmin)

adminRouter.post(
  '/boards/:boardId/transfer-ownership',
  validate({ params: adminBoardParamsSchema, body: transferOwnershipSchema }),
  postTransferOwnership,
)
