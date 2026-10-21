import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { CardDetail } from '../../types/api'
import { boardQueryScope } from './useBoard'

export type CreateCardInput = {
  columnId: string
  title: string
  dueDate: string | null
  assigneeIds: string[]
}

export function useCreateCard(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ columnId, ...card }: CreateCardInput) =>
      apiClient.post<{ card: CardDetail }>(`/columns/${columnId}/cards`, {
        title: card.title,
        ...(card.dueDate === null ? {} : { dueDate: card.dueDate }),
        ...(card.assigneeIds.length === 0 ? {} : { assigneeIds: card.assigneeIds }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: boardQueryScope(boardId) }),
  })
}
