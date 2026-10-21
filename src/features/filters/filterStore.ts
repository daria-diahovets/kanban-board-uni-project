import { useMemo } from 'react'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { BoardFilters, DueFilter } from '../../types/api'

export type FilterSelection = {
  boardId: string | null
  assigneeId: string | null
  labelId: string | null
  due: DueFilter | null
  search: string
  appliedSearch: string
  includeArchived: boolean
}

type FilterActions = {
  focusBoard: (boardId: string) => void
  toggleAssignee: (assigneeId: string) => void
  toggleLabel: (labelId: string) => void
  toggleDue: (due: DueFilter) => void
  toggleArchived: () => void
  setSearch: (search: string) => void
  commitSearch: () => void
  clear: () => void
}

const emptySelection: FilterSelection = {
  boardId: null,
  assigneeId: null,
  labelId: null,
  due: null,
  search: '',
  appliedSearch: '',
  includeArchived: false,
}

export const useFilterStore = create<FilterSelection & FilterActions>()((set) => ({
  ...emptySelection,
  focusBoard: (boardId) =>
    set((state) => (state.boardId === boardId ? state : { ...emptySelection, boardId })),
  toggleAssignee: (assigneeId) =>
    set((state) => ({ assigneeId: state.assigneeId === assigneeId ? null : assigneeId })),
  toggleLabel: (labelId) =>
    set((state) => ({ labelId: state.labelId === labelId ? null : labelId })),
  toggleDue: (due) => set((state) => ({ due: state.due === due ? null : due })),
  toggleArchived: () => set((state) => ({ includeArchived: !state.includeArchived })),
  setSearch: (search) => set({ search }),
  commitSearch: () => set((state) => ({ appliedSearch: state.search })),
  clear: () => set((state) => ({ ...emptySelection, boardId: state.boardId })),
}))

export function toBoardFilters(selection: FilterSelection): BoardFilters {
  const search = selection.appliedSearch.trim()

  return {
    ...(selection.assigneeId === null ? {} : { assigneeId: selection.assigneeId }),
    ...(selection.labelId === null ? {} : { labelId: selection.labelId }),
    ...(selection.due === null ? {} : { due: selection.due }),
    ...(search.length === 0 ? {} : { q: search }),
    ...(selection.includeArchived ? { includeArchived: true } : {}),
  }
}

export function activeBoardFilters(boardId: string): BoardFilters {
  const state = useFilterStore.getState()

  return state.boardId === boardId ? toBoardFilters(state) : {}
}

export function useFilterSelection(): FilterSelection {
  return useFilterStore(
    useShallow((state) => ({
      boardId: state.boardId,
      assigneeId: state.assigneeId,
      labelId: state.labelId,
      due: state.due,
      search: state.search,
      appliedSearch: state.appliedSearch,
      includeArchived: state.includeArchived,
    })),
  )
}

export function useBoardFilters(boardId: string): BoardFilters {
  const selection = useFilterSelection()

  return useMemo(
    () => (selection.boardId === boardId ? toBoardFilters(selection) : {}),
    [boardId, selection],
  )
}

export function countActiveFilters(filters: BoardFilters) {
  return Object.keys(filters).length
}
