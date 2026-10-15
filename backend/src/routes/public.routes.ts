import { Router } from 'express'
import { getPublicBoard } from '../controllers/shareLink.controller'
import { validate } from '../middleware/validate'
import { publicBoardParamsSchema } from '../validators/shareLink.validators'

export const publicRouter = Router()

publicRouter.get('/boards/:token', validate({ params: publicBoardParamsSchema }), getPublicBoard)
