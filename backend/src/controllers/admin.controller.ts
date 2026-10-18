import type { RequestHandler } from 'express'
import { requireUser } from '../middleware/authenticate'
import { listAllBoards, transferBoardOwnership } from '../services/admin.service'
import type { AdminBoardParams, TransferOwnershipInput } from '../validators/admin.validators'

export const listBoardsForAdmin: RequestHandler = async (_request, response) => {
  const boards = await listAllBoards()
  response.json({ boards })
}

export const postTransferOwnership: RequestHandler = async (request, response) => {
  const { boardId } = request.validated.params as AdminBoardParams
  const { newOwnerId } = request.validated.body as TransferOwnershipInput
  const board = await transferBoardOwnership(boardId, newOwnerId, requireUser(request).id)
  response.json({ board })
}
