import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { BoardDetailResponse, BoardFilters } from '../../types/api'

export function boardQueryScope(boardId: string) {
  return ['board', boardId] as const
}

export function boardQueryKey(boardId: string, filters: BoardFilters = {}) {
  return [...boardQueryScope(boardId), filters] as const
}

export function useBoard(boardId: string, filters: BoardFilters = {}) {
  return useQuery({
    queryKey: boardQueryKey(boardId, filters),
    queryFn: () =>
      apiClient.get<BoardDetailResponse>(`/boards/${boardId}`, {
        query: { ...filters },
      }),
  })
}
