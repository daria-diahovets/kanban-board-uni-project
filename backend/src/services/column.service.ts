import { prisma } from '../config/prisma'
import { ApiError } from '../lib/ApiError'
import { firstPosition, positionAfter } from '../lib/position'
import { emitToBoard } from '../realtime/emit'
import type { BoardEventContext } from '../realtime/emit'
import { SERVER_EVENTS } from '../realtime/events'
import type { CreateColumnInput, UpdateColumnInput } from '../validators/column.validators'

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

export async function createColumn(boardId: string, input: CreateColumnInput, actorId: string) {
  const lastColumn = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { position: 'desc' },
    select: { position: true },
  })

  const position = lastColumn ? positionAfter(lastColumn.position) : firstPosition()

  const column = await prisma.column.create({
    data: {
      boardId,
      title: input.title,
      wipLimit: input.wipLimit ?? null,
      position,
    },
    select: COLUMN_SELECT,
  })

  emitToBoard(boardId, SERVER_EVENTS.columnCreated, { actorId, column })

  return column
}

export async function updateColumn(
  columnId: string,
  input: UpdateColumnInput,
  context: BoardEventContext,
) {
  const column = await prisma.column.update({
    where: { id: columnId },
    data: {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.wipLimit === undefined ? {} : { wipLimit: input.wipLimit }),
    },
    select: COLUMN_SELECT,
  })

  emitToBoard(context.boardId, SERVER_EVENTS.columnUpdated, { actorId: context.actorId, column })

  return column
}

export async function deleteColumn(columnId: string, context: BoardEventContext) {
  const cardCount = await prisma.card.count({ where: { columnId } })

  if (cardCount > 0) {
    throw ApiError.conflict(
      `This column still holds ${cardCount} card${cardCount === 1 ? '' : 's'}, move or delete them first`,
    )
  }

  await prisma.column.delete({ where: { id: columnId } })

  emitToBoard(context.boardId, SERVER_EVENTS.columnDeleted, {
    actorId: context.actorId,
    columnId,
  })
}
