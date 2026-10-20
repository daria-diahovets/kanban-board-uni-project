import { Link, useParams } from 'react-router'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { StatusChip } from '../../ui/Chip/Chip'
import { Spinner } from '../../ui/Spinner/Spinner'
import { ColumnLane } from './ColumnLane'
import { useBoard } from './useBoard'
import './BoardPage.css'

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const query = useBoard(boardId ?? '')

  if (query.isPending) {
    return (
      <div className="rb-board__state">
        <Spinner label="Loading board" />
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="rb-board__state">
        <ErrorBanner error={query.error} onDismiss={() => void query.refetch()} />
        <Link to="/">Back to boards</Link>
      </div>
    )
  }

  const { board, viewerRole } = query.data
  const cardTotal = board.columns.reduce((total, column) => total + column.activeCardCount, 0)

  return (
    <div className="rb-board">
      <header className="rb-board__head">
        <Link className="rb-board__back" to="/">
          Back to boards
        </Link>
        <div className="rb-board__heading">
          <h1 className="rb-board__title">{board.title}</h1>
          <div className="rb-board__chips">
            <StatusChip>{viewerRole}</StatusChip>
            {board.isArchived ? <StatusChip tone="warning">Archived</StatusChip> : null}
          </div>
        </div>
        {board.description ? <p className="rb-board__description">{board.description}</p> : null}
        <dl className="rb-board__facts">
          <dt>Owner</dt>
          <dd>{board.owner.fullName}</dd>
          <dt>Members</dt>
          <dd>{board.members.length}</dd>
          <dt>Columns</dt>
          <dd>{board.columns.length}</dd>
          <dt>Cards</dt>
          <dd>{cardTotal}</dd>
        </dl>
      </header>

      {board.columns.length > 0 ? (
        <ul className="rb-board__lanes">
          {board.columns.map((column) => (
            <li key={column.id}>
              <ColumnLane column={column} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rb-board__empty">No columns yet</p>
      )}
    </div>
  )
}
