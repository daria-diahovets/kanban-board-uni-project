import { useState } from 'react'
import { Link } from 'react-router'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { Card } from '../../ui/Card/Card'
import { StatusChip } from '../../ui/Chip/Chip'
import { Spinner } from '../../ui/Spinner/Spinner'
import type { BoardSummary } from '../../types/api'
import { useAuth } from '../auth/useAuth'
import { TransferOwnershipDialog } from './TransferOwnershipDialog'
import { useAdminBoards } from './useAdminBoards'
import './AdminBoardsPage.css'

export function AdminBoardsPage() {
  const { user } = useAuth()
  const isAdmin = user?.systemRole === 'ADMIN'
  const boards = useAdminBoards(isAdmin)
  const [transferring, setTransferring] = useState<BoardSummary | null>(null)

  if (!isAdmin) {
    return (
      <div className="rb-admin__state">
        <h1 className="rb-admin__heading">Admin only</h1>
        <p className="rb-admin__note">This page is for administrator accounts.</p>
        <Link to="/">Back to boards</Link>
      </div>
    )
  }

  if (boards.isPending) {
    return (
      <div className="rb-admin__state">
        <Spinner label="Loading every board" />
      </div>
    )
  }

  if (boards.isError) {
    return (
      <div className="rb-admin__state">
        <ErrorBanner error={boards.error} onDismiss={() => void boards.refetch()} />
      </div>
    )
  }

  const active = boards.data.filter((board) => !board.isArchived)
  const archived = boards.data.filter((board) => board.isArchived)

  return (
    <div className="rb-admin">
      <h1 className="rb-admin__heading">Every board</h1>
      <p className="rb-admin__note">
        {boards.data.length} boards · {active.length} active · {archived.length} archived
      </p>

      {boards.data.length === 0 ? (
        <p className="rb-admin__empty">No boards exist yet</p>
      ) : (
        <ul className="rb-admin__list">
          {boards.data.map((board) => (
            <li key={board.id}>
              <Card className="rb-admin__row">
                <div className="rb-admin__identity">
                  <h2 className="rb-admin__title">
                    <Link to={`/boards/${board.id}`}>{board.title}</Link>
                  </h2>
                  {board.description ? (
                    <p className="rb-admin__description">{board.description}</p>
                  ) : null}
                  <p className="rb-admin__note">
                    Owner {board.owner.fullName} ({board.owner.email})
                  </p>
                </div>

                <div className="rb-admin__facts">
                  {board.isArchived ? <StatusChip tone="warning">Archived</StatusChip> : null}
                  <StatusChip>{`${board._count.members} members`}</StatusChip>
                  <StatusChip>{`${board._count.columns} columns`}</StatusChip>
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Transfer ownership of ${board.title}`}
                    onClick={() => setTransferring(board)}
                  >
                    Transfer ownership
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {transferring ? (
        <TransferOwnershipDialog board={transferring} onClose={() => setTransferring(null)} />
      ) : null}
    </div>
  )
}
