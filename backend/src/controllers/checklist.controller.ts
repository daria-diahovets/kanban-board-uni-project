import type { RequestHandler } from 'express'
import { requireUser } from '../middleware/authenticate'
import { boardEventContext, requireBoardAccess } from '../middleware/authorizeBoard'
import {
  createChecklistItem,
  deleteChecklistItem,
  listCardChecklist,
  updateChecklistItem,
} from '../services/checklist.service'
import type {
  CardChecklistParams,
  ChecklistItemParams,
  CreateChecklistItemInput,
  UpdateChecklistItemInput,
} from '../validators/checklist.validators'

export const listChecklist: RequestHandler = async (request, response) => {
  const { cardId } = request.validated.params as CardChecklistParams
  const items = await listCardChecklist(cardId)
  response.json({ items })
}

export const postChecklistItem: RequestHandler = async (request, response) => {
  const { cardId } = request.validated.params as CardChecklistParams
  const item = await createChecklistItem(
    requireBoardAccess(request).boardId,
    cardId,
    request.validated.body as CreateChecklistItemInput,
    requireUser(request).id,
  )
  response.status(201).json({ item })
}

export const patchChecklistItem: RequestHandler = async (request, response) => {
  const { itemId } = request.validated.params as ChecklistItemParams
  const item = await updateChecklistItem(
    itemId,
    request.validated.body as UpdateChecklistItemInput,
    boardEventContext(request),
  )
  response.json({ item })
}

export const removeChecklistItem: RequestHandler = async (request, response) => {
  const { itemId } = request.validated.params as ChecklistItemParams
  await deleteChecklistItem(itemId, boardEventContext(request))
  response.status(204).send()
}
