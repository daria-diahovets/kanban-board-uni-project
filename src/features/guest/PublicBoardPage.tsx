import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { apiClient } from '../../lib/apiClient'
import { Card } from '../../ui/Card/Card'
import { StatusChip } from '../../ui/Chip/Chip'
import { Spinner } from '../../ui/Spinner/Spinner'
import type { PublicBoardResponse } from '../../types/api'
import { cardCountSummary, dueStateOf, initialsOf, labelTone } from '../board/cardMeta'
import './PublicBoardPage.css'

export function PublicBoardPage() {
  const { token } = useParams<{ token: string }>()
  const query = useQuery({
    queryKey: ['public-board', token ?? ''],
    queryFn: () => apiClient.get<PublicBoardResponse>(`/public/boards/${token}`),
  })

  if (query.isPending) {
    return (
      <div className="rb-guest__state">
        <Spinner label="Loading shared board" />
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="rb-guest__state">
        <ErrorBanner error={query.error} onDismiss={() => void query.refetch()} />
        <Link to="/login">Sign in instead</Link>
      </div>
    )
  }

  const { board } = query.data

  return (
    <div className="rb-guest">
      <header className="rb-guest__head">
        <div className="rb-guest__heading">
          <h1 className="rb-guest__title">{board.title}</h1>
          <div className="rb-guest__chips">
            <StatusChip>Shared link</StatusChip>
            <StatusChip>Read only</StatusChip>
            {board.isArchived ? <StatusChip tone="warning">Archived</StatusChip> : null}
          </div>
        </div>
        {board.description ? <p className="rb-guest__description">{board.description}</p> : null}
        <p className="rb-guest__meta">
          Owned by {board.owner.fullName} · {board.columns.length} columns
        </p>
      </header>

      {board.columns.length === 0 ? (
        <p className="rb-guest__empty">This board has no columns</p>
      ) : (
        <ul className="rb-guest__lanes">
          {board.columns.map((column) => (
            <li key={column.id}>
              <Card variant="elevated" className="rb-guest__lane">
                <div className="rb-guest__lane-head">
                  <h2 className="rb-guest__lane-title">{column.title}</h2>
                  <StatusChip>
                    {column.wipLimit === null
                      ? `${column.cards.length} cards`
                      : `${column.cards.length} / ${column.wipLimit}`}
                  </StatusChip>
                </div>

                {column.cards.length === 0 ? (
                  <p className="rb-guest__lane-empty">No cards</p>
                ) : (
                  <ul className="rb-guest__cards">
                    {column.cards.map((card) => {
                      const dueState = dueStateOf(card.dueDate)
                      const counts = cardCountSummary(card._count)

                      return (
                        <li key={card.id}>
                          <Card className="rb-guest__card">
                            {card.labels.length > 0 ? (
                              <ul className="rb-guest__labels">
                                {card.labels.map((label) => (
                                  <li key={label.id}>
                                    <StatusChip tone={labelTone(label.colorToken)}>
                                      {label.name}
                                    </StatusChip>
                                  </li>
                                ))}
                              </ul>
                            ) : null}

                            <h3 className="rb-guest__card-title">{card.title}</h3>

                            {card.description ? (
                              <p className="rb-guest__card-description">{card.description}</p>
                            ) : null}

                            {dueState ? (
                              <StatusChip tone={dueState.tone}>{dueState.text}</StatusChip>
                            ) : null}

                            {card.assignees.length > 0 || counts.length > 0 ? (
                              <div className="rb-guest__card-foot">
                                <ul className="rb-guest__assignees">
                                  {card.assignees.map((assignee) => (
                                    <li className="rb-guest__assignee" key={assignee.id}>
                                      <span aria-hidden="true">
                                        {initialsOf(assignee.fullName)}
                                      </span>
                                      <span className="visually-hidden">{assignee.fullName}</span>
                                    </li>
                                  ))}
                                </ul>
                                {counts.length > 0 ? (
                                  <p className="rb-guest__counts">{counts.join(' / ')}</p>
                                ) : null}
                              </div>
                            ) : null}
                          </Card>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
