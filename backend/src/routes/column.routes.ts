import { Router } from 'express'
import { patchColumn, postColumn, removeColumn } from '../controllers/column.controller'
import { authenticate } from '../middleware/authenticate'
import { authorizeBoard } from '../middleware/authorizeBoard'
import { validate } from '../middleware/validate'
import {
  boardColumnsParamsSchema,
  columnParamsSchema,
  createColumnSchema,
  updateColumnSchema,
} from '../validators/column.validators'
import { columnCardsRouter } from './card.routes'

export const boardColumnsRouter = Router({ mergeParams: true })

boardColumnsRouter.post(
  '/',
  validate({ params: boardColumnsParamsSchema, body: createColumnSchema }),
  authorizeBoard('OWNER'),
  postColumn,
)

export const columnRouter = Router()

columnRouter.use(authenticate)
columnRouter.use('/:columnId/cards', columnCardsRouter)

columnRouter.patch(
  '/:columnId',
  validate({ params: columnParamsSchema, body: updateColumnSchema }),
  authorizeBoard('OWNER'),
  patchColumn,
)

columnRouter.delete(
  '/:columnId',
  validate({ params: columnParamsSchema }),
  authorizeBoard('OWNER'),
  removeColumn,
)
