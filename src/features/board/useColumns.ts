import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { ColumnSummary } from '../../types/api'
import { boardQueryScope } from './useBoard'

type ColumnPayload = { column: ColumnSummary }

function useColumnMutation<Input>(boardId: string, mutationFn: (input: Input) => Promise<unknown>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: boardQueryScope(boardId) }),
  })
}

export function useCreateColumn(boardId: string) {
  return useColumnMutation(boardId, (input: { title: string; wipLimit: number | null }) =>
    apiClient.post<ColumnPayload>(`/boards/${boardId}/columns`, input),
  )
}

export function useUpdateColumn(boardId: string) {
  return useColumnMutation(
    boardId,
    (input: { columnId: string; title: string; wipLimit: number | null }) =>
      apiClient.patch<ColumnPayload>(`/columns/${input.columnId}`, {
        title: input.title,
        wipLimit: input.wipLimit,
      }),
  )
}

export function useDeleteColumn(boardId: string) {
  return useColumnMutation(boardId, (input: { columnId: string }) =>
    apiClient.delete(`/columns/${input.columnId}`),
  )
}
