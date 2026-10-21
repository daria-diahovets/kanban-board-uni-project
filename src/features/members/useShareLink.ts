import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { ShareLink } from '../../types/api'

export function shareLinkQueryKey(boardId: string) {
  return ['board', boardId, 'share-link'] as const
}

export function useShareLink(boardId: string, enabled: boolean) {
  return useQuery({
    queryKey: shareLinkQueryKey(boardId),
    queryFn: () =>
      apiClient
        .get<{ shareLink: ShareLink | null }>(`/boards/${boardId}/share-link`)
        .then(({ shareLink }) => shareLink),
    enabled,
  })
}

function useShareLinkMutation<Input>(
  boardId: string,
  mutationFn: (input: Input) => Promise<unknown>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: shareLinkQueryKey(boardId) }),
  })
}

export function useCreateShareLink(boardId: string) {
  return useShareLinkMutation(boardId, (expiresInDays: number | null) =>
    apiClient.post(
      `/boards/${boardId}/share-link`,
      expiresInDays === null ? {} : { expiresInDays },
    ),
  )
}

export function useRevokeShareLink(boardId: string) {
  return useShareLinkMutation(boardId, () => apiClient.delete(`/boards/${boardId}/share-link`))
}

export function shareLinkUrl(token: string) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin

  return `${origin}/public/boards/${token}`
}
