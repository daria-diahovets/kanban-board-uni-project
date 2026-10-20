import type { BoardCard, BoardColumn } from '../../types/api'
import { positionBetween } from '../../lib/position'
import type { DragTarget } from './dragIds'

export type CardMovePlan = {
  cardId: string
  sourceColumnId: string
  targetColumnId: string
  targetIndex: number
  prevCardId: string | null
  nextCardId: string | null
}

export type ColumnMovePlan = {
  columnId: string
  targetIndex: number
  prevColumnId: string | null
  nextColumnId: string | null
}

export function columnIdOfCard(columns: BoardColumn[], cardId: string) {
  return columns.find((column) => column.cards.some((card) => card.id === cardId))?.id ?? null
}

function locateCard(columns: BoardColumn[], cardId: string) {
  for (const column of columns) {
    const index = column.cards.findIndex((card) => card.id === cardId)

    if (index >= 0) {
      return { column, index }
    }
  }

  return null
}

export function planCardMove(
  columns: BoardColumn[],
  cardId: string,
  target: DragTarget,
): CardMovePlan | null {
  if (target.type === 'card' && target.id === cardId) {
    return null
  }

  const source = locateCard(columns, cardId)

  if (!source) {
    return null
  }

  const targetColumnId = target.type === 'column' ? target.id : columnIdOfCard(columns, target.id)
  const targetColumn = columns.find((column) => column.id === targetColumnId)

  if (!targetColumn) {
    return null
  }

  const remaining = targetColumn.cards.filter((card) => card.id !== cardId)
  let targetIndex = remaining.length

  if (target.type === 'card') {
    const overIndex = remaining.findIndex((card) => card.id === target.id)

    if (overIndex < 0) {
      return null
    }

    const originalOverIndex = targetColumn.cards.findIndex((card) => card.id === target.id)
    const movesForward = targetColumn.id === source.column.id && source.index < originalOverIndex

    targetIndex = movesForward ? overIndex + 1 : overIndex
  }

  if (targetColumn.id === source.column.id && targetIndex === source.index) {
    return null
  }

  return {
    cardId,
    sourceColumnId: source.column.id,
    targetColumnId: targetColumn.id,
    targetIndex,
    prevCardId: remaining[targetIndex - 1]?.id ?? null,
    nextCardId: remaining[targetIndex]?.id ?? null,
  }
}

export function planColumnMove(
  columns: BoardColumn[],
  columnId: string,
  overColumnId: string,
): ColumnMovePlan | null {
  if (overColumnId === columnId) {
    return null
  }

  const sourceIndex = columns.findIndex((column) => column.id === columnId)
  const originalOverIndex = columns.findIndex((column) => column.id === overColumnId)

  if (sourceIndex < 0 || originalOverIndex < 0) {
    return null
  }

  const remaining = columns.filter((column) => column.id !== columnId)
  const overIndex = remaining.findIndex((column) => column.id === overColumnId)
  const targetIndex = sourceIndex < originalOverIndex ? overIndex + 1 : overIndex

  if (targetIndex === sourceIndex) {
    return null
  }

  return {
    columnId,
    targetIndex,
    prevColumnId: remaining[targetIndex - 1]?.id ?? null,
    nextColumnId: remaining[targetIndex]?.id ?? null,
  }
}

export function applyCardMove(columns: BoardColumn[], plan: CardMovePlan): BoardColumn[] {
  const moved = columns.flatMap((column) => column.cards).find((card) => card.id === plan.cardId)

  if (!moved) {
    return columns
  }

  const target = columns.find((column) => column.id === plan.targetColumnId)

  if (!target) {
    return columns
  }

  const remaining = target.cards.filter((card) => card.id !== plan.cardId)
  const position = positionBetween(
    remaining[plan.targetIndex - 1]?.position ?? null,
    remaining[plan.targetIndex]?.position ?? null,
  )
  const relocated: BoardCard = { ...moved, columnId: plan.targetColumnId, position }
  const changesColumn = plan.sourceColumnId !== plan.targetColumnId
  const countedCard = changesColumn && !moved.isArchived

  return columns.map((column) => {
    const withoutCard = column.cards.filter((card) => card.id !== plan.cardId)

    if (column.id === plan.targetColumnId) {
      const cards = [...withoutCard]
      cards.splice(plan.targetIndex, 0, relocated)

      return {
        ...column,
        cards,
        activeCardCount: countedCard ? column.activeCardCount + 1 : column.activeCardCount,
      }
    }

    if (column.id === plan.sourceColumnId) {
      return {
        ...column,
        cards: withoutCard,
        activeCardCount: countedCard ? column.activeCardCount - 1 : column.activeCardCount,
      }
    }

    return column
  })
}

export function applyColumnMove(columns: BoardColumn[], plan: ColumnMovePlan): BoardColumn[] {
  const moved = columns.find((column) => column.id === plan.columnId)

  if (!moved) {
    return columns
  }

  const remaining = columns.filter((column) => column.id !== plan.columnId)
  const position = positionBetween(
    remaining[plan.targetIndex - 1]?.position ?? null,
    remaining[plan.targetIndex]?.position ?? null,
  )
  const reordered = [...remaining]
  reordered.splice(plan.targetIndex, 0, { ...moved, position })

  return reordered
}
