import { useAuth } from './useAuth'
import { Card } from '../../ui/Card/Card'
import { StatusChip } from '../../ui/Chip/Chip'
import './SessionPanel.css'

export function SessionPanel() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <Card variant="elevated" className="rb-session">
      <h2 className="rb-session__heading">Signed in</h2>
      <dl className="rb-session__facts">
        <dt>Name</dt>
        <dd>{user.fullName}</dd>
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Role</dt>
        <dd>
          <StatusChip tone={user.systemRole === 'ADMIN' ? 'success' : 'default'}>
            {user.systemRole}
          </StatusChip>
        </dd>
      </dl>
    </Card>
  )
}
