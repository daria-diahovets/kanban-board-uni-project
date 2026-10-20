import type { UniqueIdentifier } from '@dnd-kit/core'

const CARD_PREFIX = 'card:'
const COLUMN_PREFIX = 'column:'

export type DragTarget = { type: 'card'; id: string } | { type: 'column'; id: string }

export function cardDragId(cardId: string) {
  return `${CARD_PREFIX}${cardId}`
}

export function columnDragId(columnId: string) {
  return `${COLUMN_PREFIX}${columnId}`
}

export function parseDragId(value: UniqueIdentifier): DragTarget | null {
  const text = String(value)

  if (text.startsWith(CARD_PREFIX)) {
    return { type: 'card', id: text.slice(CARD_PREFIX.length) }
  }

  if (text.startsWith(COLUMN_PREFIX)) {
    return { type: 'column', id: text.slice(COLUMN_PREFIX.length) }
  }

  return null
}
