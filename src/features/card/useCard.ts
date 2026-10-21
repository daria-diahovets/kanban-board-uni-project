import { useMutation, useQuery } from '@tanstack/react-query'
import { ApiError, apiClient } from '../../lib/apiClient'
import type { CardDetail } from '../../types/api'
import { cardQueryKey, useCardMutation, useCardRefresh } from './cardQueries'
import type { CardScope } from './cardQueries'

type CardPayload = { card: CardDetail }

export type CardEditInput = {
  title?: string
  description?: string | null
  dueDate?: string | null
  isArchived?: boolean
  version?: number
}

export function useCard(cardId: string | null) {
  return useQuery({
    queryKey: cardQueryKey(cardId ?? ''),
    queryFn: () => apiClient.get<CardPayload>(`/cards/${cardId}`).then(({ card }) => card),
    enabled: cardId !== null,
  })
}

export function useUpdateCard(scope: CardScope) {
  const refresh = useCardRefresh(scope)

  return useMutation({
    mutationFn: (input: CardEditInput) =>
      apiClient.patch<CardPayload>(`/cards/${scope.cardId}`, input),
    onSuccess: refresh,
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.isConflict) {
        void refresh()
      }
    },
  })
}

export function useDeleteCard(scope: CardScope) {
  return useCardMutation(scope, () => apiClient.delete(`/cards/${scope.cardId}`))
}

export function useSetCardAssignees(scope: CardScope) {
  return useCardMutation(scope, (userIds: string[]) =>
    apiClient.put<CardPayload>(`/cards/${scope.cardId}/assignees`, { userIds }),
  )
}

export function useSetCardLabels(scope: CardScope) {
  return useCardMutation(scope, (labelIds: string[]) =>
    apiClient.put<CardPayload>(`/cards/${scope.cardId}/labels`, { labelIds }),
  )
}
