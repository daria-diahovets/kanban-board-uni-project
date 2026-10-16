import { Router } from 'express'
import {
  getBoard,
  listBoards,
  patchBoard,
  patchBoardArchive,
  postBoard,
  removeBoard,
} from '../controllers/board.controller'
import { authenticate } from '../middleware/authenticate'
import { authorizeBoard } from '../middleware/authorizeBoard'
import { validate } from '../middleware/validate'
import {
  archiveBoardSchema,
  boardIdParamsSchema,
  boardQuerySchema,
  createBoardSchema,
  updateBoardSchema,
} from '../validators/board.validators'
import { boardColumnsRouter } from './column.routes'
import { boardLabelsRouter } from './label.routes'
import { memberRouter } from './member.routes'
import { shareLinkRouter } from './shareLink.routes'

export const boardRouter = Router()

boardRouter.use(authenticate)
boardRouter.use('/:boardId/members', memberRouter)
boardRouter.use('/:boardId/share-link', shareLinkRouter)
boardRouter.use('/:boardId/columns', boardColumnsRouter)
boardRouter.use('/:boardId/labels', boardLabelsRouter)

boardRouter.get('/', listBoards)
boardRouter.post('/', validate({ body: createBoardSchema }), postBoard)

boardRouter.get(
  '/:boardId',
  validate({ params: boardIdParamsSchema, query: boardQuerySchema }),
  authorizeBoard('VIEWER'),
  getBoard,
)

boardRouter.patch(
  '/:boardId',
  validate({ params: boardIdParamsSchema, body: updateBoardSchema }),
  authorizeBoard('OWNER'),
  patchBoard,
)

boardRouter.patch(
  '/:boardId/archive',
  validate({ params: boardIdParamsSchema, body: archiveBoardSchema }),
  authorizeBoard('OWNER', { allowArchived: true }),
  patchBoardArchive,
)

boardRouter.delete(
  '/:boardId',
  validate({ params: boardIdParamsSchema }),
  authorizeBoard('OWNER', { allowArchived: true }),
  removeBoard,
)
