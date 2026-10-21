import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { boardQueryKey } from '../board/useBoard'

export function cardQueryKey(cardId: string) {
  return ['card', cardId] as const
}

export function commentsQueryKey(cardId: string) {
  return ['card', cardId, 'comments'] as const
}

export function checklistQueryKey(cardId: string) {
  return ['card', cardId, 'checklist'] as const
}

export function attachmentsQueryKey(cardId: string) {
  return ['card', cardId, 'attachments'] as const
}

export function boardLabelsQueryKey(boardId: string) {
  return ['board', boardId, 'labels'] as const
}

export type CardScope = {
  boardId: string
  cardId: string
}

export function useCardRefresh(scope: CardScope, extraKeys: QueryKey[] = []) {
  const queryClient = useQueryClient()

  return async () => {
    await Promise.all(
      [cardQueryKey(scope.cardId), boardQueryKey(scope.boardId), ...extraKeys].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    )
  }
}

export function useCardMutation<Input>(
  scope: CardScope,
  mutationFn: (input: Input) => Promise<unknown>,
  extraKeys: QueryKey[] = [],
) {
  const refresh = useCardRefresh(scope, extraKeys)

  return useMutation({ mutationFn, onSuccess: refresh })
}
