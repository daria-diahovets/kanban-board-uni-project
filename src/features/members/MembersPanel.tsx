import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { StatusChip } from '../../ui/Chip/Chip'
import { List, ListItem } from '../../ui/List/List'
import { Radio } from '../../ui/Radio/Radio'
import { Spinner } from '../../ui/Spinner/Spinner'
import { formatTimestamp } from '../card/cardRules'
import { InviteMemberForm } from './InviteMemberForm'
import { useMembers, useRemoveMember, useUpdateMemberRole } from './useMembers'
import type { AssignableRole } from './useMembers'
import './MembersPanel.css'

const ASSIGNABLE_ROLES: AssignableRole[] = ['MEMBER', 'VIEWER']

type MembersPanelProps = {
  boardId: string
  ownerId: string
  manageable: boolean
}

export function MembersPanel({ boardId, ownerId, manageable }: MembersPanelProps) {
  const members = useMembers(boardId)
  const updateRole = useUpdateMemberRole(boardId)
  const removeMember = useRemoveMember(boardId)

  const mutationError = updateRole.error ?? removeMember.error

  function dismissErrors() {
    updateRole.reset()
    removeMember.reset()
  }

  if (members.isPending) {
    return <Spinner label="Loading members" />
  }

  if (members.isError) {
    return <ErrorBanner error={members.error} onDismiss={() => void members.refetch()} />
  }

  return (
    <div className="rb-members">
      {mutationError ? <ErrorBanner error={mutationError} onDismiss={dismissErrors} /> : null}

      <List className="rb-members__list">
        {members.data.map((member) => {
          const isOwner = member.user.id === ownerId

          return (
            <ListItem className="rb-members__item" key={member.user.id}>
              <div className="rb-members__identity">
                <span className="rb-members__name">{member.user.fullName}</span>
                <span className="rb-members__email">{member.user.email}</span>
                <span className="rb-members__meta">
                  Joined {formatTimestamp(member.joinedAt)}
                  {member.invitedBy ? ` · invited by ${member.invitedBy.fullName}` : ''}
                </span>
              </div>

              <div className="rb-members__controls">
                <StatusChip tone={isOwner ? 'success' : 'default'}>{member.role}</StatusChip>

                {manageable && !isOwner ? (
                  <>
                    <div className="rb-members__roles">
                      {ASSIGNABLE_ROLES.map((assignable) => (
                        <Radio
                          key={assignable}
                          name={`role-${member.user.id}`}
                          label={assignable}
                          value={assignable}
                          checked={member.role === assignable}
                          disabled={updateRole.isPending}
                          onChange={() => {
                            dismissErrors()
                            updateRole.mutate({ userId: member.user.id, role: assignable })
                          }}
                        />
                      ))}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      aria-label={`Remove ${member.user.fullName}`}
                      disabled={removeMember.isPending}
                      onClick={() => {
                        dismissErrors()
                        removeMember.mutate(member.user.id)
                      }}
                    >
                      Remove
                    </Button>
                  </>
                ) : null}
              </div>
            </ListItem>
          )
        })}
      </List>

      {manageable ? <InviteMemberForm boardId={boardId} /> : null}
    </div>
  )
}
