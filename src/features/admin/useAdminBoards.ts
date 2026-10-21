import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { BoardSummary } from '../../types/api'
import { boardQueryScope } from '../board/useBoard'

export function adminBoardsQueryKey() {
  return ['admin', 'boards'] as const
}

export function useAdminBoards(enabled: boolean) {
  return useQuery({
    queryKey: adminBoardsQueryKey(),
    queryFn: () =>
      apiClient.get<{ boards: BoardSummary[] }>('/admin/boards').then(({ boards }) => boards),
    enabled,
  })
}

export function useTransferOwnership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { boardId: string; newOwnerId: string }) =>
      apiClient.post<{ board: BoardSummary }>(`/admin/boards/${input.boardId}/transfer-ownership`, {
        newOwnerId: input.newOwnerId,
      }),
    onSuccess: async (_result, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminBoardsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: boardQueryScope(input.boardId) }),
        queryClient.invalidateQueries({ queryKey: ['boards'] }),
      ])
    },
  })
}
