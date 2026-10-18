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
import type { MoveColumnInput } from '../validators/columnMove.validators'

const MOVED_COLUMN_SELECT = {
  id: true,
  boardId: true,
  title: true,
  position: true,
  wipLimit: true,
  updatedAt: true,
} as const

async function lockBoardRow(transaction: TransactionClient, boardId: string) {
  await transaction.$queryRaw`SELECT id FROM boards WHERE id = ${boardId}::uuid FOR UPDATE`
}

async function lockColumnRow(transaction: TransactionClient, columnId: string) {
  await transaction.$queryRaw`SELECT id FROM columns WHERE id = ${columnId}::uuid FOR UPDATE`
}

async function loadAnchor(
  transaction: TransactionClient,
  boardId: string,
  anchorId: string,
): Promise<OrderAnchor> {
  const anchor = await transaction.column.findUnique({
    where: { id: anchorId },
    select: { id: true, boardId: true, position: true, createdAt: true },
  })

  if (!anchor || anchor.boardId !== boardId) {
    throw ApiError.badRequest('Neighbour column does not belong to this board')
  }

  return { id: anchor.id, position: anchor.position, createdAt: anchor.createdAt }
}

async function resolveNeighbours(
  transaction: TransactionClient,
  boardId: string,
  columnId: string,
  input: MoveColumnInput,
) {
  const exclude = { boardId, id: { not: columnId } }

  if (input.prevColumnId) {
    const previous = await loadAnchor(transaction, boardId, input.prevColumnId)
    const next = await transaction.column.findFirst({
      where: { ...exclude, ...afterAnchor(previous) },
      orderBy: ASCENDING_POSITION_ORDER,
      select: { position: true },
    })

    return { previous: previous.position, next: next?.position ?? null }
  }

  if (input.nextColumnId) {
    const next = await loadAnchor(transaction, boardId, input.nextColumnId)
    const previous = await transaction.column.findFirst({
      where: { ...exclude, ...beforeAnchor(next) },
      orderBy: DESCENDING_POSITION_ORDER,
      select: { position: true },
    })

    return { previous: previous?.position ?? null, next: next.position }
  }

  const last = await transaction.column.findFirst({
    where: exclude,
    orderBy: DESCENDING_POSITION_ORDER,
    select: { position: true },
  })

  return { previous: last?.position ?? null, next: null }
}

async function rebalanceBoard(transaction: TransactionClient, boardId: string, columnId: string) {
  const columns = await transaction.column.findMany({
    where: { boardId, id: { not: columnId } },
    orderBy: ASCENDING_POSITION_ORDER,
    select: { id: true },
  })

  const positions = rebalancedPositions(columns.length)

  for (const [index, column] of columns.entries()) {
    await transaction.column.update({
      where: { id: column.id },
      data: { position: positions[index] },
    })
  }
}

export async function moveColumn(
  boardId: string,
  columnId: string,
  input: MoveColumnInput,
  actorId: string,
) {
  if (input.prevColumnId === columnId || input.nextColumnId === columnId) {
    throw ApiError.badRequest('A column cannot be positioned relative to itself')
  }

  const column = await runSerializable(async (transaction) => {
    await lockBoardRow(transaction, boardId)
    await lockColumnRow(transaction, columnId)

    const column = await transaction.column.findUnique({
      where: { id: columnId },
      select: { boardId: true },
    })

    if (!column) {
      throw ApiError.notFound('Column not found')
    }

    if (column.boardId !== boardId) {
      throw ApiError.badRequest('Column belongs to a different board')
    }

    let neighbours = await resolveNeighbours(transaction, boardId, columnId, input)

    if (needsRebalance(neighbours.previous, neighbours.next)) {
      await rebalanceBoard(transaction, boardId, columnId)
      neighbours = await resolveNeighbours(transaction, boardId, columnId, input)
    }

    return transaction.column.update({
      where: { id: columnId },
      data: { position: positionBetween(neighbours.previous, neighbours.next) },
      select: MOVED_COLUMN_SELECT,
    })
  })

  emitToBoard(boardId, SERVER_EVENTS.columnMoved, { actorId, column })

  return column
}
