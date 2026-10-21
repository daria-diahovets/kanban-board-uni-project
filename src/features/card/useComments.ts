import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { Comment } from '../../types/api'
import { commentsQueryKey, useCardMutation } from './cardQueries'
import type { CardScope } from './cardQueries'

export function useComments(cardId: string | null) {
  return useQuery({
    queryKey: commentsQueryKey(cardId ?? ''),
    queryFn: () =>
      apiClient
        .get<{ comments: Comment[] }>(`/cards/${cardId}/comments`)
        .then(({ comments }) => comments),
    enabled: cardId !== null,
  })
}

export function useCreateComment(scope: CardScope) {
  return useCardMutation(
    scope,
    (body: string) => apiClient.post(`/cards/${scope.cardId}/comments`, { body }),
    [commentsQueryKey(scope.cardId)],
  )
}

export function useUpdateComment(scope: CardScope) {
  return useCardMutation(
    scope,
    (input: { commentId: string; body: string }) =>
      apiClient.patch(`/comments/${input.commentId}`, { body: input.body }),
    [commentsQueryKey(scope.cardId)],
  )
}

export function useDeleteComment(scope: CardScope) {
  return useCardMutation(scope, (commentId: string) => apiClient.delete(`/comments/${commentId}`), [
    commentsQueryKey(scope.cardId),
  ])
}
