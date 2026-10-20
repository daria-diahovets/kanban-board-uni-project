import type {
  BoardCard,
  BoardMembership,
  ColumnSummary,
  MovedCard,
  MovedColumn,
} from '../../types/api'

export const CLIENT_EVENTS = {
  joinBoard: 'board:join',
  leaveBoard: 'board:leave',
} as const

export const SERVER_EVENTS = {
  cardCreated: 'card:created',
  cardUpdated: 'card:updated',
  cardMoved: 'card:moved',
  cardDeleted: 'card:deleted',
  columnCreated: 'column:created',
  columnUpdated: 'column:updated',
  columnMoved: 'column:moved',
  columnDeleted: 'column:deleted',
  commentCreated: 'comment:created',
  commentUpdated: 'comment:updated',
  commentDeleted: 'comment:deleted',
  memberAdded: 'member:added',
  memberRemoved: 'member:removed',
  memberRoleChanged: 'member:role-changed',
  boardUpdated: 'board:updated',
  boardArchived: 'board:archived',
  boardDeleted: 'board:deleted',
} as const

export type ServerEvent = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS]

export const SERVER_EVENT_NAMES = Object.values(SERVER_EVENTS)

export type BoardEnvelope = {
  boardId: string
  actorId: string | null
}

export type CardCreatedPayload = BoardEnvelope & { card: BoardCard }
export type CardMovedPayload = BoardEnvelope & { card: MovedCard }
export type CardUpdatedPayload = BoardEnvelope & { card?: BoardCard; cardId?: string }
export type CardDeletedPayload = BoardEnvelope & { cardId: string; columnId: string }
export type ColumnCreatedPayload = BoardEnvelope & { column: ColumnSummary }
export type ColumnMovedPayload = BoardEnvelope & { column: MovedColumn }
export type ColumnDeletedPayload = BoardEnvelope & { columnId: string }
export type MemberPayload = BoardEnvelope & { member?: BoardMembership; userId?: string }

export type RealtimePayload = BoardEnvelope & Record<string, unknown>

export function joinRoomAcknowledgement(result: unknown) {
  const acknowledgement = result as { joined?: string; left?: string; error?: string } | undefined

  return {
    joined: acknowledgement?.joined ?? null,
    error: acknowledgement?.error ?? null,
  }
}
