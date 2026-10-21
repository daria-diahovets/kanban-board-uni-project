import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { StatusChip } from '../../ui/Chip/Chip'
import { Spinner } from '../../ui/Spinner/Spinner'
import { FilterBar } from '../filters/FilterBar'
import { useBoardFilters, useFilterStore } from '../filters/filterStore'
import { BoardCanvas } from './BoardCanvas'
import { useBoard } from './useBoard'
import { useBoardRealtime } from './useBoardRealtime'
import './BoardPage.css'

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const focusBoard = useFilterStore((state) => state.focusBoard)
  const filters = useBoardFilters(boardId ?? '')
  const query = useBoard(boardId ?? '', filters)
  const realtimeStatus = useBoardRealtime(boardId ?? '')

  useEffect(() => {
    if (boardId) {
      focusBoard(boardId)
    }
  }, [boardId, focusBoard])

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
  const matchingCards = board.columns.reduce((total, column) => total + column.cards.length, 0)
  const editable = !board.isArchived
  const cardsEditable = editable && (viewerRole === 'OWNER' || viewerRole === 'MEMBER')
  const columnsManageable = editable && viewerRole === 'OWNER'

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
            {realtimeStatus === 'joined' ? <StatusChip tone="success">Live</StatusChip> : null}
            {realtimeStatus === 'refused' ? (
              <StatusChip tone="error">No live updates</StatusChip>
            ) : null}
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

      <FilterBar members={board.members} labels={board.labels} matchingCards={matchingCards} />

      <BoardCanvas
        boardId={board.id}
        columns={board.columns}
        members={board.members}
        cardsEditable={cardsEditable}
        columnsManageable={columnsManageable}
        isBoardOwner={viewerRole === 'OWNER'}
      />
    </div>
  )
}
