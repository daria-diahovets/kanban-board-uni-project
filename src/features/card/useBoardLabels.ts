import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { BoardLabel, LabelColor } from '../../types/api'
import { boardLabelsQueryKey, useCardMutation } from './cardQueries'
import type { CardScope } from './cardQueries'

export function useBoardLabels(boardId: string) {
  return useQuery({
    queryKey: boardLabelsQueryKey(boardId),
    queryFn: () =>
      apiClient
        .get<{ labels: BoardLabel[] }>(`/boards/${boardId}/labels`)
        .then(({ labels }) => labels),
  })
}

export function useCreateLabel(scope: CardScope) {
  return useCardMutation(
    scope,
    (input: { name: string; colorToken: LabelColor }) =>
      apiClient.post(`/boards/${scope.boardId}/labels`, input),
    [boardLabelsQueryKey(scope.boardId)],
  )
}

export function useUpdateLabel(scope: CardScope) {
  return useCardMutation(
    scope,
    (input: { labelId: string; name: string; colorToken: LabelColor }) =>
      apiClient.patch(`/labels/${input.labelId}`, {
        name: input.name,
        colorToken: input.colorToken,
      }),
    [boardLabelsQueryKey(scope.boardId)],
  )
}

export function useDeleteLabel(scope: CardScope) {
  return useCardMutation(scope, (labelId: string) => apiClient.delete(`/labels/${labelId}`), [
    boardLabelsQueryKey(scope.boardId),
  ])
}
