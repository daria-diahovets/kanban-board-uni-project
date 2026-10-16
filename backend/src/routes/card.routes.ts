import { Router } from 'express'
import {
  getCard,
  patchCard,
  postCard,
  putCardAssignees,
  removeCard,
} from '../controllers/card.controller'
import { authenticate } from '../middleware/authenticate'
import { authorizeBoard } from '../middleware/authorizeBoard'
import { validate } from '../middleware/validate'
import {
  cardParamsSchema,
  columnCardsParamsSchema,
  createCardSchema,
  setAssigneesSchema,
  updateCardSchema,
} from '../validators/card.validators'

export const columnCardsRouter = Router({ mergeParams: true })

columnCardsRouter.post(
  '/',
  validate({ params: columnCardsParamsSchema, body: createCardSchema }),
  authorizeBoard('MEMBER'),
  postCard,
)

export const cardRouter = Router()

cardRouter.use(authenticate)

cardRouter.get(
  '/:cardId',
  validate({ params: cardParamsSchema }),
  authorizeBoard('VIEWER'),
  getCard,
)

cardRouter.patch(
  '/:cardId',
  validate({ params: cardParamsSchema, body: updateCardSchema }),
  authorizeBoard('MEMBER'),
  patchCard,
)

cardRouter.put(
  '/:cardId/assignees',
  validate({ params: cardParamsSchema, body: setAssigneesSchema }),
  authorizeBoard('MEMBER'),
  putCardAssignees,
)

cardRouter.delete(
  '/:cardId',
  validate({ params: cardParamsSchema }),
  authorizeBoard('MEMBER'),
  removeCard,
)
