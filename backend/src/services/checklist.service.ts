import { prisma } from '../config/prisma'
import { ApiError } from '../lib/ApiError'
import { ASCENDING_POSITION_ORDER, DESCENDING_POSITION_ORDER } from '../lib/ordering'
import { firstPosition, positionAfter } from '../lib/position'
import { emitToBoard } from '../realtime/emit'
import type { BoardEventContext } from '../realtime/emit'
import { SERVER_EVENTS } from '../realtime/events'
import type {
  CreateChecklistItemInput,
  UpdateChecklistItemInput,
} from '../validators/checklist.validators'

const CHECKLIST_ITEM_SELECT = {
  id: true,
  cardId: true,
  text: true,
  isDone: true,
  position: true,
  createdAt: true,
} as const

export async function listCardChecklist(cardId: string) {
  return prisma.checklistItem.findMany({
    where: { cardId },
    select: CHECKLIST_ITEM_SELECT,
    orderBy: ASCENDING_POSITION_ORDER,
  })
}

export async function createChecklistItem(
  boardId: string,
  cardId: string,
  input: CreateChecklistItemInput,
  actorId: string,
) {
  const lastItem = await prisma.checklistItem.findFirst({
    where: { cardId },
    orderBy: DESCENDING_POSITION_ORDER,
    select: { position: true },
  })

  const item = await prisma.checklistItem.create({
    data: {
      cardId,
      text: input.text,
      isDone: input.isDone,
      position: lastItem ? positionAfter(lastItem.position) : firstPosition(),
    },
    select: CHECKLIST_ITEM_SELECT,
  })

  emitToBoard(boardId, SERVER_EVENTS.cardUpdated, { actorId, cardId, checklistItem: item })

  return item
}

export async function updateChecklistItem(
  itemId: string,
  input: UpdateChecklistItemInput,
  context: BoardEventContext,
) {
  const existing = await prisma.checklistItem.findUnique({
    where: { id: itemId },
    select: { id: true },
  })

  if (!existing) {
    throw ApiError.notFound('Checklist item not found')
  }

  const updated = await prisma.checklistItem.update({
    where: { id: itemId },
    data: {
      ...(input.text === undefined ? {} : { text: input.text }),
      ...(input.isDone === undefined ? {} : { isDone: input.isDone }),
    },
    select: CHECKLIST_ITEM_SELECT,
  })

  emitToBoard(context.boardId, SERVER_EVENTS.cardUpdated, {
    actorId: context.actorId,
    cardId: updated.cardId,
    checklistItem: updated,
  })

  return updated
}

export async function deleteChecklistItem(itemId: string, context: BoardEventContext) {
  const item = await prisma.checklistItem.delete({
    where: { id: itemId },
    select: { id: true, cardId: true },
  })

  emitToBoard(context.boardId, SERVER_EVENTS.cardUpdated, {
    actorId: context.actorId,
    cardId: item.cardId,
    removedChecklistItemId: item.id,
  })
}
