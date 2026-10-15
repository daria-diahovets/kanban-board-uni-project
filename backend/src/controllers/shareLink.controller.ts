import type { RequestHandler } from 'express'
import { requireUser } from '../middleware/authenticate'
import { requireBoardAccess } from '../middleware/authorizeBoard'
import { getPublicBoardView } from '../services/board.service'
import {
  createShareLink,
  getActiveShareLink,
  resolveShareToken,
  revokeShareLink,
} from '../services/shareLink.service'
import type { CreateShareLinkInput, PublicBoardParams } from '../validators/shareLink.validators'

export const getShareLink: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  const shareLink = await getActiveShareLink(boardId)
  response.json({ shareLink })
}

export const postShareLink: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  const shareLink = await createShareLink(
    boardId,
    requireUser(request).id,
    request.validated.body as CreateShareLinkInput,
  )
  response.status(201).json({ shareLink })
}

export const deleteShareLink: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  await revokeShareLink(boardId)
  response.status(204).send()
}

export const getPublicBoard: RequestHandler = async (request, response) => {
  const { token } = request.validated.params as PublicBoardParams
  const boardId = await resolveShareToken(token)
  const board = await getPublicBoardView(boardId)
  response.json({ board, access: 'guest' })
}
