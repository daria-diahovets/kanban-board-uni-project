import { Router } from 'express'
import {
  listChecklist,
  patchChecklistItem,
  postChecklistItem,
  removeChecklistItem,
} from '../controllers/checklist.controller'
import { authenticate } from '../middleware/authenticate'
import { authorizeBoard } from '../middleware/authorizeBoard'
import { validate } from '../middleware/validate'
import {
  cardChecklistParamsSchema,
  checklistItemParamsSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
} from '../validators/checklist.validators'

export const cardChecklistRouter = Router({ mergeParams: true })

cardChecklistRouter.get(
  '/',
  validate({ params: cardChecklistParamsSchema }),
  authorizeBoard('VIEWER'),
  listChecklist,
)

cardChecklistRouter.post(
  '/',
  validate({ params: cardChecklistParamsSchema, body: createChecklistItemSchema }),
  authorizeBoard('MEMBER'),
  postChecklistItem,
)

export const checklistRouter = Router()

checklistRouter.use(authenticate)

checklistRouter.patch(
  '/:itemId',
  validate({ params: checklistItemParamsSchema, body: updateChecklistItemSchema }),
  authorizeBoard('MEMBER'),
  patchChecklistItem,
)

checklistRouter.delete(
  '/:itemId',
  validate({ params: checklistItemParamsSchema }),
  authorizeBoard('MEMBER'),
  removeChecklistItem,
)
