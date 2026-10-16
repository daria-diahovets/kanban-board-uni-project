import { Router } from 'express'
import { listLabels, patchLabel, postLabel, removeLabel } from '../controllers/label.controller'
import { authenticate } from '../middleware/authenticate'
import { authorizeBoard } from '../middleware/authorizeBoard'
import { validate } from '../middleware/validate'
import {
  boardLabelsParamsSchema,
  createLabelSchema,
  labelParamsSchema,
  updateLabelSchema,
} from '../validators/label.validators'

export const boardLabelsRouter = Router({ mergeParams: true })

boardLabelsRouter.get(
  '/',
  validate({ params: boardLabelsParamsSchema }),
  authorizeBoard('VIEWER'),
  listLabels,
)

boardLabelsRouter.post(
  '/',
  validate({ params: boardLabelsParamsSchema, body: createLabelSchema }),
  authorizeBoard('MEMBER'),
  postLabel,
)

export const labelRouter = Router()

labelRouter.use(authenticate)

labelRouter.patch(
  '/:labelId',
  validate({ params: labelParamsSchema, body: updateLabelSchema }),
  authorizeBoard('MEMBER'),
  patchLabel,
)

labelRouter.delete(
  '/:labelId',
  validate({ params: labelParamsSchema }),
  authorizeBoard('MEMBER'),
  removeLabel,
)
