import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { ChecklistItem } from '../../types/api'
import { checklistQueryKey, useCardMutation } from './cardQueries'
import type { CardScope } from './cardQueries'

export function useChecklist(cardId: string | null) {
  return useQuery({
    queryKey: checklistQueryKey(cardId ?? ''),
    queryFn: () =>
      apiClient
        .get<{ items: ChecklistItem[] }>(`/cards/${cardId}/checklist`)
        .then(({ items }) => items),
    enabled: cardId !== null,
  })
}

export function useCreateChecklistItem(scope: CardScope) {
  return useCardMutation(
    scope,
    (text: string) => apiClient.post(`/cards/${scope.cardId}/checklist`, { text }),
    [checklistQueryKey(scope.cardId)],
  )
}

export function useUpdateChecklistItem(scope: CardScope) {
  return useCardMutation(
    scope,
    (input: { itemId: string; text?: string; isDone?: boolean }) =>
      apiClient.patch(`/checklist/${input.itemId}`, {
        ...(input.text === undefined ? {} : { text: input.text }),
        ...(input.isDone === undefined ? {} : { isDone: input.isDone }),
      }),
    [checklistQueryKey(scope.cardId)],
  )
}

export function useDeleteChecklistItem(scope: CardScope) {
  return useCardMutation(scope, (itemId: string) => apiClient.delete(`/checklist/${itemId}`), [
    checklistQueryKey(scope.cardId),
  ])
}
