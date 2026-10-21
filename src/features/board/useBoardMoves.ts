import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { BoardDetailResponse, BoardFilters, MovedCard, MovedColumn } from '../../types/api'
import { activeBoardFilters } from '../filters/filterStore'
import { applyCardMove, applyColumnMove } from './boardReorder'
import type { CardMovePlan, ColumnMovePlan } from './boardReorder'
import { boardQueryKey, boardQueryScope } from './useBoard'

type BoardSnapshot = { snapshot: BoardDetailResponse | undefined }

function reorderCachedBoard(
  queryClient: QueryClient,
  boardId: string,
  filters: BoardFilters,
  reorder: (
    columns: BoardDetailResponse['board']['columns'],
  ) => BoardDetailResponse['board']['columns'],
) {
  const queryKey = boardQueryKey(boardId, filters)
  const snapshot = queryClient.getQueryData<BoardDetailResponse>(queryKey)

  if (snapshot) {
    queryClient.setQueryData<BoardDetailResponse>(queryKey, {
      ...snapshot,
      board: { ...snapshot.board, columns: reorder(snapshot.board.columns) },
    })
  }

  return { snapshot }
}

function restoreCachedBoard(
  queryClient: QueryClient,
  boardId: string,
  filters: BoardFilters,
  context: BoardSnapshot | undefined,
) {
  if (context?.snapshot) {
    queryClient.setQueryData(boardQueryKey(boardId, filters), context.snapshot)
  }
}

export function useMoveCard(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation<{ card: MovedCard }, Error, CardMovePlan, BoardSnapshot>({
    mutationFn: (plan) =>
      apiClient.post<{ card: MovedCard }>(`/cards/${plan.cardId}/move`, {
        targetColumnId: plan.targetColumnId,
        prevCardId: plan.prevCardId,
        nextCardId: plan.nextCardId,
      }),
    onMutate: async (plan) => {
      await queryClient.cancelQueries({ queryKey: boardQueryScope(boardId) })

      return reorderCachedBoard(queryClient, boardId, activeBoardFilters(boardId), (columns) =>
        applyCardMove(columns, plan),
      )
    },
    onError: (_error, _plan, context) =>
      restoreCachedBoard(queryClient, boardId, activeBoardFilters(boardId), context),
    onSettled: () => queryClient.invalidateQueries({ queryKey: boardQueryScope(boardId) }),
  })
}

export function useMoveColumn(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation<{ column: MovedColumn }, Error, ColumnMovePlan, BoardSnapshot>({
    mutationFn: (plan) =>
      apiClient.post<{ column: MovedColumn }>(`/columns/${plan.columnId}/move`, {
        prevColumnId: plan.prevColumnId,
        nextColumnId: plan.nextColumnId,
      }),
    onMutate: async (plan) => {
      await queryClient.cancelQueries({ queryKey: boardQueryScope(boardId) })

      return reorderCachedBoard(queryClient, boardId, activeBoardFilters(boardId), (columns) =>
        applyColumnMove(columns, plan),
      )
    },
    onError: (_error, _plan, context) =>
      restoreCachedBoard(queryClient, boardId, activeBoardFilters(boardId), context),
    onSettled: () => queryClient.invalidateQueries({ queryKey: boardQueryScope(boardId) }),
  })
}
