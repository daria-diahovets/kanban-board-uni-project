import { ApiError } from '../lib/ApiError'
import {
  ASCENDING_POSITION_ORDER,
  DESCENDING_POSITION_ORDER,
  afterAnchor,
  beforeAnchor,
} from '../lib/ordering'
import type { OrderAnchor } from '../lib/ordering'
import { needsRebalance, positionBetween, rebalancedPositions } from '../lib/position'
import { runSerializable } from '../lib/transaction'
import { emitToBoard } from '../realtime/emit'
import { SERVER_EVENTS } from '../realtime/events'
import type { TransactionClient } from '../lib/transaction'
import type { MoveCardInput } from '../validators/cardMove.validators'

const MOVED_CARD_SELECT = {
  id: true,
  columnId: true,
  title: true,
  position: true,
  isArchived: true,
  version: true,
  updatedAt: true,
} as const

async function lockColumnRow(transaction: TransactionClient, columnId: string) {
  await transaction.$queryRaw`SELECT id FROM columns WHERE id = ${columnId}::uuid FOR UPDATE`
}

async function lockCardRow(transaction: TransactionClient, cardId: string) {
  await transaction.$queryRaw`SELECT id FROM cards WHERE id = ${cardId}::uuid FOR UPDATE`
}

async function loadAnchor(
  transaction: TransactionClient,
  columnId: string,
  anchorId: string,
): Promise<OrderAnchor> {
  const anchor = await transaction.card.findUnique({
    where: { id: anchorId },
    select: { id: true, columnId: true, position: true, createdAt: true },
  })

  if (!anchor || anchor.columnId !== columnId) {
    throw ApiError.badRequest('Neighbour card does not belong to the target column')
  }

  return { id: anchor.id, position: anchor.position, createdAt: anchor.createdAt }
}

async function resolveNeighbours(
  transaction: TransactionClient,
  cardId: string,
  targetColumnId: string,
  input: MoveCardInput,
) {
  const exclude = { columnId: targetColumnId, id: { not: cardId } }

  if (input.prevCardId) {
    const previous = await loadAnchor(transaction, targetColumnId, input.prevCardId)
    const next = await transaction.card.findFirst({
      where: { ...exclude, ...afterAnchor(previous) },
      orderBy: ASCENDING_POSITION_ORDER,
      select: { position: true },
    })

    return { previous: previous.position, next: next?.position ?? null }
  }

  if (input.nextCardId) {
    const next = await loadAnchor(transaction, targetColumnId, input.nextCardId)
    const previous = await transaction.card.findFirst({
      where: { ...exclude, ...beforeAnchor(next) },
      orderBy: DESCENDING_POSITION_ORDER,
      select: { position: true },
    })

    return { previous: previous?.position ?? null, next: next.position }
  }

  const last = await transaction.card.findFirst({
    where: exclude,
    orderBy: DESCENDING_POSITION_ORDER,
    select: { position: true },
  })

  return { previous: last?.position ?? null, next: null }
}

async function rebalanceColumn(transaction: TransactionClient, columnId: string, cardId: string) {
  const cards = await transaction.card.findMany({
    where: { columnId, id: { not: cardId } },
    orderBy: ASCENDING_POSITION_ORDER,
    select: { id: true },
  })

  const positions = rebalancedPositions(cards.length)

  for (const [index, card] of cards.entries()) {
    await transaction.card.update({
      where: { id: card.id },
      data: { position: positions[index] },
    })
  }
}

async function assertWipLimitAllowsIncomingCard(
  transaction: TransactionClient,
  targetColumnId: string,
  cardId: string,
) {
  const column = await transaction.column.findUnique({
    where: { id: targetColumnId },
    select: { wipLimit: true, title: true },
  })

  if (!column) {
    throw ApiError.notFound('Target column not found')
  }

  if (column.wipLimit === null) {
    return
  }

  const occupied = await transaction.card.count({
    where: { columnId: targetColumnId, isArchived: false, id: { not: cardId } },
  })

  if (occupied >= column.wipLimit) {
    throw ApiError.conflict(
      `Column "${column.title}" has reached its limit of ${column.wipLimit} cards`,
    )
  }
}

export async function moveCard(
  boardId: string,
  cardId: string,
  input: MoveCardInput,
  actorId: string,
) {
  if (input.prevCardId === cardId || input.nextCardId === cardId) {
    throw ApiError.badRequest('A card cannot be positioned relative to itself')
  }

  const card = await runSerializable(async (transaction) => {
    await lockColumnRow(transaction, input.targetColumnId)
    await lockCardRow(transaction, cardId)

    const card = await transaction.card.findUnique({
      where: { id: cardId },
      select: { id: true, columnId: true, isArchived: true },
    })

    if (!card) {
      throw ApiError.notFound('Card not found')
    }

    const targetColumn = await transaction.column.findUnique({
      where: { id: input.targetColumnId },
      select: { boardId: true },
    })

    if (!targetColumn || targetColumn.boardId !== boardId) {
      throw ApiError.badRequest('Target column belongs to a different board')
    }

    const isChangingColumn = card.columnId !== input.targetColumnId

    if (isChangingColumn && !card.isArchived) {
      await assertWipLimitAllowsIncomingCard(transaction, input.targetColumnId, cardId)
    }

    let neighbours = await resolveNeighbours(transaction, cardId, input.targetColumnId, input)

    if (needsRebalance(neighbours.previous, neighbours.next)) {
      await rebalanceColumn(transaction, input.targetColumnId, cardId)
      neighbours = await resolveNeighbours(transaction, cardId, input.targetColumnId, input)
    }

    return transaction.card.update({
      where: { id: cardId },
      data: {
        columnId: input.targetColumnId,
        position: positionBetween(neighbours.previous, neighbours.next),
        version: { increment: 1 },
      },
      select: MOVED_CARD_SELECT,
    })
  })

  emitToBoard(boardId, SERVER_EVENTS.cardMoved, { actorId, card })

  return card
}
