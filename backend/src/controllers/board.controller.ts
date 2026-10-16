import type { RequestHandler } from 'express'
import { requireUser } from '../middleware/authenticate'
import { requireBoardAccess } from '../middleware/authorizeBoard'
import {
  createBoard,
  deleteBoard,
  getBoardDetail,
  listBoardsForUser,
  setBoardArchived,
  updateBoard,
} from '../services/board.service'
import type {
  ArchiveBoardInput,
  BoardQuery,
  CreateBoardInput,
  UpdateBoardInput,
} from '../validators/board.validators'

export const listBoards: RequestHandler = async (request, response) => {
  const boards = await listBoardsForUser(requireUser(request).id)
  response.json({ boards })
}

export const getBoard: RequestHandler = async (request, response) => {
  const { boardId, role } = requireBoardAccess(request)
  const filters = (request.validated.query ?? {}) as BoardQuery
  const board = await getBoardDetail(boardId, filters)
  response.json({ board, viewerRole: role, filters })
}

export const postBoard: RequestHandler = async (request, response) => {
  const board = await createBoard(
    requireUser(request).id,
    request.validated.body as CreateBoardInput,
  )
  response.status(201).json({ board })
}

export const patchBoard: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  const board = await updateBoard(boardId, request.validated.body as UpdateBoardInput)
  response.json({ board })
}

export const patchBoardArchive: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  const { isArchived } = request.validated.body as ArchiveBoardInput
  const board = await setBoardArchived(boardId, isArchived)
  response.json({ board })
}

export const removeBoard: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  await deleteBoard(boardId)
  response.status(204).send()
}
