import type { RequestHandler } from 'express'
import { listAllBoards, transferBoardOwnership } from '../services/admin.service'
import type { AdminBoardParams, TransferOwnershipInput } from '../validators/admin.validators'

export const listBoardsForAdmin: RequestHandler = async (_request, response) => {
  const boards = await listAllBoards()
  response.json({ boards })
}

export const postTransferOwnership: RequestHandler = async (request, response) => {
  const { boardId } = request.validated.params as AdminBoardParams
  const { newOwnerId } = request.validated.body as TransferOwnershipInput
  const board = await transferBoardOwnership(boardId, newOwnerId)
  response.json({ board })
}
