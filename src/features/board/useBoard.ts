import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { BoardDetailResponse } from '../../types/api'

export function boardQueryKey(boardId: string) {
  return ['board', boardId] as const
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: boardQueryKey(boardId),
    queryFn: () => apiClient.get<BoardDetailResponse>(`/boards/${boardId}`),
  })
}
