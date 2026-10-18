import type { ServerEvent } from './events'
import { boardRoom } from './events'
import { getRealtimeServer } from './io'

type BoardEventPayload = Record<string, unknown> & { actorId: string | null }

export type BoardEventContext = {
  boardId: string
  actorId: string
}

export function emitToBoard(boardId: string, event: ServerEvent, payload: BoardEventPayload) {
  const server = getRealtimeServer()

  if (!server) {
    return
  }

  server.to(boardRoom(boardId)).emit(event, { boardId, ...payload })
}
