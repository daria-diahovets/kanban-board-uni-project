import { Button } from '../../ui/Button/Button'
import { FilterChip, StatusChip } from '../../ui/Chip/Chip'
import type { BoardMembership, DueFilter, Label } from '../../types/api'
import { SearchInput } from './SearchInput'
import {
  countActiveFilters,
  toBoardFilters,
  useFilterSelection,
  useFilterStore,
} from './filterStore'
import './FilterBar.css'

const DUE_FILTERS: { value: DueFilter; label: string }[] = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due today' },
  { value: 'week', label: 'Due this week' },
  { value: 'none', label: 'No due date' },
]

type FilterBarProps = {
  members: BoardMembership[]
  labels: Label[]
  matchingCards: number
}

export function FilterBar({ members, labels, matchingCards }: FilterBarProps) {
  const selection = useFilterSelection()
  const toggleAssignee = useFilterStore((state) => state.toggleAssignee)
  const toggleLabel = useFilterStore((state) => state.toggleLabel)
  const toggleDue = useFilterStore((state) => state.toggleDue)
  const toggleArchived = useFilterStore((state) => state.toggleArchived)
  const clear = useFilterStore((state) => state.clear)

  const activeCount = countActiveFilters(toBoardFilters(selection))

  return (
    <section className="rb-filters" aria-label="Card filters">
      <div className="rb-filters__search">
        <SearchInput search={selection.search} appliedSearch={selection.appliedSearch} />
      </div>

      <div className="rb-filters__group">
        <h2 className="rb-filters__heading">Assignee</h2>
        <div className="rb-filters__chips">
          {members.length === 0 ? <p className="rb-filters__note">No members</p> : null}
          {members.map((member) => (
            <FilterChip
              key={member.user.id}
              active={selection.assigneeId === member.user.id}
              onToggle={() => toggleAssignee(member.user.id)}
            >
              {member.user.fullName}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="rb-filters__group">
        <h2 className="rb-filters__heading">Label</h2>
        <div className="rb-filters__chips">
          {labels.length === 0 ? <p className="rb-filters__note">No labels</p> : null}
          {labels.map((label) => (
            <FilterChip
              key={label.id}
              active={selection.labelId === label.id}
              onToggle={() => toggleLabel(label.id)}
            >
              {label.name}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="rb-filters__group">
        <h2 className="rb-filters__heading">Due date</h2>
        <div className="rb-filters__chips">
          {DUE_FILTERS.map((due) => (
            <FilterChip
              key={due.value}
              active={selection.due === due.value}
              onToggle={() => toggleDue(due.value)}
            >
              {due.label}
            </FilterChip>
          ))}
          <FilterChip active={selection.includeArchived} onToggle={toggleArchived}>
            Include archived
          </FilterChip>
        </div>
      </div>

      <div className="rb-filters__summary">
        <StatusChip tone={activeCount > 0 ? 'warning' : 'default'}>
          {activeCount === 0 ? 'No filters' : `${activeCount} active`}
        </StatusChip>
        <StatusChip>{`${matchingCards} cards shown`}</StatusChip>
        {activeCount > 0 ? (
          <Button variant="secondary" size="sm" onClick={clear}>
            Clear all
          </Button>
        ) : null}
      </div>
    </section>
  )
}
