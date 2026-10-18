import type { RequestHandler } from 'express'
import { requireUser } from '../middleware/authenticate'
import { boardEventContext, requireBoardAccess } from '../middleware/authorizeBoard'
import {
  createCard,
  deleteCard,
  getCardDetail,
  setCardAssignees,
  updateCard,
} from '../services/card.service'
import { moveCard } from '../services/cardMove.service'
import type {
  CardParams,
  ColumnCardsParams,
  CreateCardInput,
  SetAssigneesInput,
  UpdateCardInput,
} from '../validators/card.validators'
import type { MoveCardInput } from '../validators/cardMove.validators'

export const postCard: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  const { columnId } = request.validated.params as ColumnCardsParams
  const card = await createCard(
    boardId,
    columnId,
    requireUser(request).id,
    request.validated.body as CreateCardInput,
  )
  response.status(201).json({ card })
}

export const getCard: RequestHandler = async (request, response) => {
  const { cardId } = request.validated.params as CardParams
  const card = await getCardDetail(cardId)
  response.json({ card })
}

export const patchCard: RequestHandler = async (request, response) => {
  const { cardId } = request.validated.params as CardParams
  const card = await updateCard(
    cardId,
    request.validated.body as UpdateCardInput,
    boardEventContext(request),
  )
  response.json({ card })
}

export const putCardAssignees: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  const { cardId } = request.validated.params as CardParams
  const card = await setCardAssignees(
    boardId,
    cardId,
    request.validated.body as SetAssigneesInput,
    requireUser(request).id,
  )
  response.json({ card })
}

export const removeCard: RequestHandler = async (request, response) => {
  const { cardId } = request.validated.params as CardParams
  await deleteCard(cardId, boardEventContext(request))
  response.status(204).send()
}

export const postCardMove: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  const { cardId } = request.validated.params as CardParams
  const card = await moveCard(
    boardId,
    cardId,
    request.validated.body as MoveCardInput,
    requireUser(request).id,
  )
  response.json({ card })
}
