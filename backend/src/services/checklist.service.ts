import { prisma } from '../config/prisma'
import { ApiError } from '../lib/ApiError'
import { ASCENDING_POSITION_ORDER, DESCENDING_POSITION_ORDER } from '../lib/ordering'
import { firstPosition, positionAfter } from '../lib/position'
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

export async function createChecklistItem(cardId: string, input: CreateChecklistItemInput) {
  const lastItem = await prisma.checklistItem.findFirst({
    where: { cardId },
    orderBy: DESCENDING_POSITION_ORDER,
    select: { position: true },
  })

  return prisma.checklistItem.create({
    data: {
      cardId,
      text: input.text,
      isDone: input.isDone,
      position: lastItem ? positionAfter(lastItem.position) : firstPosition(),
    },
    select: CHECKLIST_ITEM_SELECT,
  })
}

export async function updateChecklistItem(itemId: string, input: UpdateChecklistItemInput) {
  const item = await prisma.checklistItem.findUnique({
    where: { id: itemId },
    select: { id: true },
  })

  if (!item) {
    throw ApiError.notFound('Checklist item not found')
  }

  return prisma.checklistItem.update({
    where: { id: itemId },
    data: {
      ...(input.text === undefined ? {} : { text: input.text }),
      ...(input.isDone === undefined ? {} : { isDone: input.isDone }),
    },
    select: CHECKLIST_ITEM_SELECT,
  })
}

export async function deleteChecklistItem(itemId: string) {
  await prisma.checklistItem.delete({ where: { id: itemId } })
}
