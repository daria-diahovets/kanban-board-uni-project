import { useEffect } from 'react'
import { Input } from '../../ui/Input/Input'
import { useFilterStore } from './filterStore'

export const SEARCH_DEBOUNCE_MS = 300

type SearchInputProps = {
  search: string
  appliedSearch: string
}

export function SearchInput({ search, appliedSearch }: SearchInputProps) {
  const setSearch = useFilterStore((state) => state.setSearch)
  const commitSearch = useFilterStore((state) => state.commitSearch)

  useEffect(() => {
    if (search === appliedSearch) {
      return
    }

    const timer = setTimeout(commitSearch, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [appliedSearch, commitSearch, search])

  return (
    <Input
      label="Search cards"
      name="search"
      type="search"
      value={search}
      placeholder="Title or description"
      helperText={
        search === appliedSearch ? 'Searches titles and descriptions' : 'Searching as you type'
      }
      onChange={(event) => setSearch(event.target.value)}
    />
  )
}
