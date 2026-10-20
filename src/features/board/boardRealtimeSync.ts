import type { QueryClient } from '@tanstack/react-query'
import type { BoardDetailResponse } from '../../types/api'
import { REFETCH, patchBoard } from './boardPatch'
import { SERVER_EVENTS } from './realtimeEvents'
import type { RealtimePayload } from './realtimeEvents'
import { boardQueryKey } from './useBoard'

type BoardEventTarget = {
  boardId: string
  viewerId: string
}

export function applyBoardEvent(
  queryClient: QueryClient,
  target: BoardEventTarget,
  event: string,
  payload: RealtimePayload,
) {
  if (payload?.boardId !== target.boardId || payload.actorId === target.viewerId) {
    return
  }

  const queryKey = boardQueryKey(target.boardId)

  if (event === SERVER_EVENTS.boardDeleted) {
    queryClient.removeQueries({ queryKey })
    return
  }

  const cached = queryClient.getQueryData<BoardDetailResponse>(queryKey)

  if (!cached) {
    void queryClient.invalidateQueries({ queryKey })
    return
  }

  const patched = patchBoard(cached.board, event, payload)

  if (patched === REFETCH) {
    void queryClient.invalidateQueries({ queryKey })
    return
  }

  queryClient.setQueryData<BoardDetailResponse>(queryKey, { ...cached, board: patched })
}
