import { Link } from 'react-router'
import { Card } from '../../ui/Card/Card'
import { StatusChip } from '../../ui/Chip/Chip'
import { Button } from '../../ui/Button/Button'
import type { BoardSummary } from '../../types/api'
import './BoardTile.css'

type BoardTileProps = {
  board: BoardSummary
  isOwner: boolean
  busy: boolean
  onEdit: (board: BoardSummary) => void
  onToggleArchive: (board: BoardSummary) => void
  onDelete: (board: BoardSummary) => void
}

export function BoardTile({
  board,
  isOwner,
  busy,
  onEdit,
  onToggleArchive,
  onDelete,
}: BoardTileProps) {
  return (
    <Card className="rb-board-tile">
      <div className="rb-board-tile__head">
        <h3 className="rb-board-tile__title">
          <Link to={`/boards/${board.id}`}>{board.title}</Link>
        </h3>
        {board.isArchived ? <StatusChip tone="warning">Archived</StatusChip> : null}
      </div>
      {board.description ? <p className="rb-board-tile__description">{board.description}</p> : null}
      <dl className="rb-board-tile__facts">
        <dt>Owner</dt>
        <dd>{board.owner.fullName}</dd>
        <dt>Members</dt>
        <dd>{board._count.members}</dd>
        <dt>Columns</dt>
        <dd>{board._count.columns}</dd>
      </dl>
      {isOwner ? (
        <div className="rb-board-tile__actions">
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => onEdit(board)}>
            Edit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => onToggleArchive(board)}
          >
            {board.isArchived ? 'Un-archive' : 'Archive'}
          </Button>
          <Button variant="destructive" size="sm" disabled={busy} onClick={() => onDelete(board)}>
            Delete
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
