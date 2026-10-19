import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { BoardSummary } from '../../types/api'

const BOARDS_KEY = ['boards'] as const

type BoardPayload = { board: BoardSummary }

export function useBoards() {
  return useQuery({
    queryKey: BOARDS_KEY,
    queryFn: () =>
      apiClient.get<{ boards: BoardSummary[] }>('/boards').then(({ boards }) => boards),
  })
}

function useBoardMutation<Input>(mutationFn: (input: Input) => Promise<unknown>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOARDS_KEY }),
  })
}

export function useCreateBoard() {
  return useBoardMutation((input: { title: string; description?: string }) =>
    apiClient.post<BoardPayload>('/boards', input),
  )
}

export function useUpdateBoard() {
  return useBoardMutation(
    (input: { boardId: string; title?: string; description?: string | null }) =>
      apiClient.patch<BoardPayload>(`/boards/${input.boardId}`, {
        ...(input.title === undefined ? {} : { title: input.title }),
        ...(input.description === undefined ? {} : { description: input.description }),
      }),
  )
}

export function useArchiveBoard() {
  return useBoardMutation((input: { boardId: string; isArchived: boolean }) =>
    apiClient.patch<BoardPayload>(`/boards/${input.boardId}/archive`, {
      isArchived: input.isArchived,
    }),
  )
}

export function useDeleteBoard() {
  return useBoardMutation((input: { boardId: string }) =>
    apiClient.delete(`/boards/${input.boardId}`),
  )
}
