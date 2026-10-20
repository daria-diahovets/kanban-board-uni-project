import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { MovedCard, MovedColumn } from '../../types/api'
import { boardQueryKey } from './useBoard'

export type CardMoveRequest = {
  cardId: string
  targetColumnId: string
  prevCardId: string | null
  nextCardId: string | null
}

export type ColumnMoveRequest = {
  columnId: string
  prevColumnId: string | null
  nextColumnId: string | null
}

export function useMoveCard(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cardId, ...body }: CardMoveRequest) =>
      apiClient.post<{ card: MovedCard }>(`/cards/${cardId}/move`, body),
    onSettled: () => queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) }),
  })
}

export function useMoveColumn(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ columnId, ...body }: ColumnMoveRequest) =>
      apiClient.post<{ column: MovedColumn }>(`/columns/${columnId}/move`, body),
    onSettled: () => queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) }),
  })
}
