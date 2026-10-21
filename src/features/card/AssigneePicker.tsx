import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Checkbox } from '../../ui/Checkbox/Checkbox'
import type { BoardMembership, UserRef } from '../../types/api'
import { useSetCardAssignees } from './useCard'
import type { CardScope } from './cardQueries'

type AssigneePickerProps = {
  scope: CardScope
  members: BoardMembership[]
  assignees: UserRef[]
  editable: boolean
}

export function AssigneePicker({ scope, members, assignees, editable }: AssigneePickerProps) {
  const setAssignees = useSetCardAssignees(scope)
  const assignedIds = assignees.map((assignee) => assignee.id)

  function toggle(userId: string) {
    const next = assignedIds.includes(userId)
      ? assignedIds.filter((id) => id !== userId)
      : [...assignedIds, userId]

    setAssignees.mutate(next)
  }

  return (
    <div className="rb-card-modal__stack">
      {setAssignees.error ? (
        <ErrorBanner error={setAssignees.error} onDismiss={() => setAssignees.reset()} />
      ) : null}
      {members.length === 0 ? <p className="rb-card-modal__note">No members to assign</p> : null}
      <div className="rb-card-modal__options">
        {members.map((member) => (
          <Checkbox
            key={member.user.id}
            label={`${member.user.fullName} (${member.role})`}
            checked={assignedIds.includes(member.user.id)}
            disabled={!editable || setAssignees.isPending}
            onChange={() => toggle(member.user.id)}
          />
        ))}
      </div>
    </div>
  )
}
