import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { BoardMemberEntry, BoardRole } from '../../types/api'
import { boardQueryScope } from '../board/useBoard'

export type AssignableRole = Extract<BoardRole, 'MEMBER' | 'VIEWER'>

export function membersQueryKey(boardId: string) {
  return ['board', boardId, 'members'] as const
}

export function useMembers(boardId: string) {
  return useQuery({
    queryKey: membersQueryKey(boardId),
    queryFn: () =>
      apiClient
        .get<{ members: BoardMemberEntry[] }>(`/boards/${boardId}/members`)
        .then(({ members }) => members),
  })
}

function useMemberMutation<Input>(boardId: string, mutationFn: (input: Input) => Promise<unknown>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: boardQueryScope(boardId) }),
  })
}

export function useInviteMember(boardId: string) {
  return useMemberMutation(boardId, (input: { email: string; role: AssignableRole }) =>
    apiClient.post(`/boards/${boardId}/members`, input),
  )
}

export function useUpdateMemberRole(boardId: string) {
  return useMemberMutation(boardId, (input: { userId: string; role: AssignableRole }) =>
    apiClient.patch(`/boards/${boardId}/members/${input.userId}`, { role: input.role }),
  )
}

export function useRemoveMember(boardId: string) {
  return useMemberMutation(boardId, (userId: string) =>
    apiClient.delete(`/boards/${boardId}/members/${userId}`),
  )
}
