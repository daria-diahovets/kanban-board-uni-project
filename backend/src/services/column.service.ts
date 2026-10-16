import { prisma } from '../config/prisma'
import { ApiError } from '../lib/ApiError'
import type { CreateColumnInput, UpdateColumnInput } from '../validators/column.validators'

export const POSITION_STEP = 1024

const COLUMN_SELECT = {
  id: true,
  boardId: true,
  title: true,
  position: true,
  wipLimit: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { cards: true } },
} as const

export async function createColumn(boardId: string, input: CreateColumnInput) {
  const lastColumn = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { position: 'desc' },
    select: { position: true },
  })

  const position = lastColumn ? lastColumn.position.plus(POSITION_STEP) : POSITION_STEP

  return prisma.column.create({
    data: {
      boardId,
      title: input.title,
      wipLimit: input.wipLimit ?? null,
      position,
    },
    select: COLUMN_SELECT,
  })
}

export async function updateColumn(columnId: string, input: UpdateColumnInput) {
  return prisma.column.update({
    where: { id: columnId },
    data: {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.wipLimit === undefined ? {} : { wipLimit: input.wipLimit }),
    },
    select: COLUMN_SELECT,
  })
}

export async function deleteColumn(columnId: string) {
  const cardCount = await prisma.card.count({ where: { columnId } })

  if (cardCount > 0) {
    throw ApiError.conflict(
      `This column still holds ${cardCount} card${cardCount === 1 ? '' : 's'}, move or delete them first`,
    )
  }

  await prisma.column.delete({ where: { id: columnId } })
}
