import type { RequestHandler } from 'express'
import { requireBoardAccess } from '../middleware/authorizeBoard'
import { createColumn, deleteColumn, updateColumn } from '../services/column.service'
import { moveColumn } from '../services/columnMove.service'
import type {
  ColumnParams,
  CreateColumnInput,
  UpdateColumnInput,
} from '../validators/column.validators'
import type { MoveColumnInput } from '../validators/columnMove.validators'

export const postColumn: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  const column = await createColumn(boardId, request.validated.body as CreateColumnInput)
  response.status(201).json({ column })
}

export const patchColumn: RequestHandler = async (request, response) => {
  const { columnId } = request.validated.params as ColumnParams
  const column = await updateColumn(columnId, request.validated.body as UpdateColumnInput)
  response.json({ column })
}

export const postColumnMove: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  const { columnId } = request.validated.params as ColumnParams
  const column = await moveColumn(boardId, columnId, request.validated.body as MoveColumnInput)
  response.json({ column })
}

export const removeColumn: RequestHandler = async (request, response) => {
  const { columnId } = request.validated.params as ColumnParams
  await deleteColumn(columnId)
  response.status(204).send()
}
