import type { QueryClient } from '@tanstack/react-query'
import type { BoardDetailResponse, BoardFilters } from '../../types/api'
import { REFETCH, patchBoard } from './boardPatch'
import { SERVER_EVENTS } from './realtimeEvents'
import type { RealtimePayload } from './realtimeEvents'
import { boardQueryKey, boardQueryScope } from './useBoard'

type BoardEventTarget = {
  boardId: string
  viewerId: string
  filters: BoardFilters
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

  const scope = boardQueryScope(target.boardId)

  if (event === SERVER_EVENTS.boardDeleted) {
    queryClient.removeQueries({ queryKey: scope })
    return
  }

  const queryKey = boardQueryKey(target.boardId, target.filters)
  const cached = queryClient.getQueryData<BoardDetailResponse>(queryKey)
  const filtered = Object.keys(target.filters).length > 0

  if (!cached || filtered) {
    void queryClient.invalidateQueries({ queryKey: scope })
    return
  }

  const patched = patchBoard(cached.board, event, payload)

  if (patched === REFETCH) {
    void queryClient.invalidateQueries({ queryKey: scope })
    return
  }

  queryClient.setQueryData<BoardDetailResponse>(queryKey, { ...cached, board: patched })
}
