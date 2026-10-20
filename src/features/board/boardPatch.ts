import { positionValue } from '../../lib/position'
import type { BoardCard, BoardColumn, BoardDetail } from '../../types/api'
import { SERVER_EVENTS } from './realtimeEvents'
import type {
  CardCreatedPayload,
  CardDeletedPayload,
  CardMovedPayload,
  CardUpdatedPayload,
  ColumnCreatedPayload,
  ColumnDeletedPayload,
  ColumnMovedPayload,
  RealtimePayload,
} from './realtimeEvents'

export const REFETCH = 'refetch'

export type BoardPatch = BoardDetail | typeof REFETCH

type Ordered = { position: string; createdAt: string; id: string }

function byCanonicalOrder(first: Ordered, second: Ordered) {
  const byPosition = positionValue(first.position) - positionValue(second.position)

  if (byPosition !== 0) {
    return byPosition
  }

  const byCreation = first.createdAt.localeCompare(second.createdAt)

  return byCreation === 0 ? first.id.localeCompare(second.id) : byCreation
}

function locateCard(columns: BoardColumn[], cardId: string) {
  for (const column of columns) {
    const card = column.cards.find((entry) => entry.id === cardId)

    if (card) {
      return { column, card }
    }
  }

  return null
}

function countedChange(card: BoardCard) {
  return card.isArchived ? 0 : 1
}

function placeCard(columns: BoardColumn[], card: BoardCard, previousColumnId: string | null) {
  const leaves = previousColumnId !== null && previousColumnId !== card.columnId

  return columns.map((column) => {
    if (column.id === card.columnId) {
      const cards = [...column.cards.filter((entry) => entry.id !== card.id), card].sort(
        byCanonicalOrder,
      )
      const held = column.cards.some((entry) => entry.id === card.id)

      return {
        ...column,
        cards,
        activeCardCount: held
          ? column.activeCardCount
          : column.activeCardCount + countedChange(card),
      }
    }

    if (leaves && column.id === previousColumnId) {
      return {
        ...column,
        cards: column.cards.filter((entry) => entry.id !== card.id),
        activeCardCount: column.activeCardCount - countedChange(card),
      }
    }

    return column
  })
}

function withColumns(board: BoardDetail, columns: BoardColumn[]): BoardDetail {
  return { ...board, columns }
}

function patchCardCreated(board: BoardDetail, payload: CardCreatedPayload): BoardPatch {
  if (!payload.card || !board.columns.some((column) => column.id === payload.card.columnId)) {
    return REFETCH
  }

  return withColumns(board, placeCard(board.columns, payload.card, null))
}

function patchCardMoved(board: BoardDetail, payload: CardMovedPayload): BoardPatch {
  const located = payload.card ? locateCard(board.columns, payload.card.id) : null

  if (!located || !board.columns.some((column) => column.id === payload.card.columnId)) {
    return REFETCH
  }

  const moved: BoardCard = { ...located.card, ...payload.card }

  return withColumns(board, placeCard(board.columns, moved, located.column.id))
}

function patchCardUpdated(board: BoardDetail, payload: CardUpdatedPayload): BoardPatch {
  if (!payload.card) {
    return REFETCH
  }

  const located = locateCard(board.columns, payload.card.id)

  if (!located || !board.columns.some((column) => column.id === payload.card?.columnId)) {
    return REFETCH
  }

  const updated: BoardCard = { ...located.card, ...payload.card }

  if (updated.isArchived !== located.card.isArchived) {
    return REFETCH
  }

  return withColumns(board, placeCard(board.columns, updated, located.column.id))
}

function patchCardDeleted(board: BoardDetail, payload: CardDeletedPayload): BoardPatch {
  const located = locateCard(board.columns, payload.cardId)

  if (!located) {
    return REFETCH
  }

  return withColumns(
    board,
    board.columns.map((column) =>
      column.id === located.column.id
        ? {
            ...column,
            cards: column.cards.filter((entry) => entry.id !== payload.cardId),
            activeCardCount: column.activeCardCount - countedChange(located.card),
          }
        : column,
    ),
  )
}

function patchColumnCreated(board: BoardDetail, payload: ColumnCreatedPayload): BoardPatch {
  if (!payload.column) {
    return REFETCH
  }

  if (board.columns.some((column) => column.id === payload.column.id)) {
    return board
  }

  const created: BoardColumn = {
    id: payload.column.id,
    title: payload.column.title,
    position: payload.column.position,
    wipLimit: payload.column.wipLimit,
    createdAt: payload.column.createdAt,
    activeCardCount: 0,
    cards: [],
  }

  return withColumns(board, [...board.columns, created].sort(byCanonicalOrder))
}

function patchColumnChanged(
  board: BoardDetail,
  payload: ColumnCreatedPayload | ColumnMovedPayload,
): BoardPatch {
  if (!payload.column || !board.columns.some((column) => column.id === payload.column.id)) {
    return REFETCH
  }

  const columns = board.columns
    .map((column) =>
      column.id === payload.column.id
        ? {
            ...column,
            title: payload.column.title,
            position: payload.column.position,
            wipLimit: payload.column.wipLimit,
          }
        : column,
    )
    .sort(byCanonicalOrder)

  return withColumns(board, columns)
}

function patchColumnDeleted(board: BoardDetail, payload: ColumnDeletedPayload): BoardPatch {
  if (!board.columns.some((column) => column.id === payload.columnId)) {
    return REFETCH
  }

  return withColumns(
    board,
    board.columns.filter((column) => column.id !== payload.columnId),
  )
}

export function patchBoard(
  board: BoardDetail,
  event: string,
  payload: RealtimePayload,
): BoardPatch {
  switch (event) {
    case SERVER_EVENTS.cardCreated:
      return patchCardCreated(board, payload as CardCreatedPayload)
    case SERVER_EVENTS.cardMoved:
      return patchCardMoved(board, payload as CardMovedPayload)
    case SERVER_EVENTS.cardUpdated:
      return patchCardUpdated(board, payload as CardUpdatedPayload)
    case SERVER_EVENTS.cardDeleted:
      return patchCardDeleted(board, payload as CardDeletedPayload)
    case SERVER_EVENTS.columnCreated:
      return patchColumnCreated(board, payload as ColumnCreatedPayload)
    case SERVER_EVENTS.columnUpdated:
    case SERVER_EVENTS.columnMoved:
      return patchColumnChanged(board, payload as ColumnMovedPayload)
    case SERVER_EVENTS.columnDeleted:
      return patchColumnDeleted(board, payload as ColumnDeletedPayload)
    default:
      return REFETCH
  }
}
