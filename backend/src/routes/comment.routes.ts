import { Router } from 'express'
import {
  listComments,
  patchComment,
  postComment,
  removeComment,
} from '../controllers/comment.controller'
import { authenticate } from '../middleware/authenticate'
import { authorizeBoard } from '../middleware/authorizeBoard'
import { validate } from '../middleware/validate'
import {
  cardCommentsParamsSchema,
  commentParamsSchema,
  createCommentSchema,
  updateCommentSchema,
} from '../validators/comment.validators'

export const cardCommentsRouter = Router({ mergeParams: true })

cardCommentsRouter.get(
  '/',
  validate({ params: cardCommentsParamsSchema }),
  authorizeBoard('VIEWER'),
  listComments,
)

cardCommentsRouter.post(
  '/',
  validate({ params: cardCommentsParamsSchema, body: createCommentSchema }),
  authorizeBoard('MEMBER'),
  postComment,
)

export const commentRouter = Router()

commentRouter.use(authenticate)

commentRouter.patch(
  '/:commentId',
  validate({ params: commentParamsSchema, body: updateCommentSchema }),
  authorizeBoard('MEMBER'),
  patchComment,
)

commentRouter.delete(
  '/:commentId',
  validate({ params: commentParamsSchema }),
  authorizeBoard('MEMBER'),
  removeComment,
)
