import { Card } from '../../ui/Card/Card'
import { StatusChip } from '../../ui/Chip/Chip'
import { classNames } from '../../lib/classNames'
import type { BoardCard } from '../../types/api'
import { cardCountSummary, dueStateOf, initialsOf, labelTone } from './cardMeta'
import './CardTile.css'

type CardTileProps = {
  card: BoardCard
  className?: string
}

export function CardTile({ card, className }: CardTileProps) {
  const dueState = dueStateOf(card.dueDate)
  const counts = cardCountSummary(card._count)

  return (
    <Card className={classNames('rb-card-tile', className)}>
      {card.labels.length > 0 ? (
        <ul className="rb-card-tile__labels">
          {card.labels.map((label) => (
            <li key={label.id}>
              <StatusChip tone={labelTone(label.colorToken)}>{label.name}</StatusChip>
            </li>
          ))}
        </ul>
      ) : null}

      <h3 className="rb-card-tile__title">{card.title}</h3>

      {dueState || card.isArchived ? (
        <div className="rb-card-tile__state">
          {dueState ? <StatusChip tone={dueState.tone}>{dueState.text}</StatusChip> : null}
          {card.isArchived ? <StatusChip tone="warning">Archived</StatusChip> : null}
        </div>
      ) : null}

      {card.assignees.length > 0 || counts.length > 0 ? (
        <div className="rb-card-tile__foot">
          {card.assignees.length > 0 ? (
            <ul className="rb-card-tile__assignees">
              {card.assignees.map((assignee) => (
                <li className="rb-card-tile__assignee" key={assignee.id}>
                  <span aria-hidden="true">{initialsOf(assignee.fullName)}</span>
                  <span className="visually-hidden">{assignee.fullName}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {counts.length > 0 ? <p className="rb-card-tile__counts">{counts.join(' / ')}</p> : null}
        </div>
      ) : null}
    </Card>
  )
}
