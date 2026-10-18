import type { RequestHandler } from 'express'
import { requireUser } from '../middleware/authenticate'
import { requireBoardAccess } from '../middleware/authorizeBoard'
import { setCardLabels } from '../services/card.service'
import { createLabel, deleteLabel, listBoardLabels, updateLabel } from '../services/label.service'
import type { CardParams } from '../validators/card.validators'
import type {
  CreateLabelInput,
  LabelParams,
  SetCardLabelsInput,
  UpdateLabelInput,
} from '../validators/label.validators'

export const listLabels: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  const labels = await listBoardLabels(boardId)
  response.json({ labels })
}

export const postLabel: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  const label = await createLabel(boardId, request.validated.body as CreateLabelInput)
  response.status(201).json({ label })
}

export const patchLabel: RequestHandler = async (request, response) => {
  const { labelId } = request.validated.params as LabelParams
  const label = await updateLabel(labelId, request.validated.body as UpdateLabelInput)
  response.json({ label })
}

export const removeLabel: RequestHandler = async (request, response) => {
  const { labelId } = request.validated.params as LabelParams
  await deleteLabel(labelId)
  response.status(204).send()
}

export const putCardLabels: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  const { cardId } = request.validated.params as CardParams
  const card = await setCardLabels(
    boardId,
    cardId,
    request.validated.body as SetCardLabelsInput,
    requireUser(request).id,
  )
  response.json({ card })
}
