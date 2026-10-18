export const BOARD_ROOM_PREFIX = 'board:'

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
  commentDeleted: 'comment:deleted',
  memberAdded: 'member:added',
  memberRemoved: 'member:removed',
  memberRoleChanged: 'member:role-changed',
  boardUpdated: 'board:updated',
  boardArchived: 'board:archived',
} as const

export type ServerEvent = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS]

export function boardRoom(boardId: string) {
  return `${BOARD_ROOM_PREFIX}${boardId}`
}
