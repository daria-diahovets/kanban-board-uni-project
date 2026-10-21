import type { ReactNode } from 'react'
import { Card } from '../../ui/Card/Card'
import { StatusChip } from '../../ui/Chip/Chip'
import type { ChipTone } from '../../ui/Chip/Chip'
import { classNames } from '../../lib/classNames'
import type { BoardCard, BoardColumn } from '../../types/api'
import { CardTile } from './CardTile'
import './ColumnLane.css'

type ColumnLaneProps = {
  column: BoardColumn
  headerActions?: ReactNode
  renderCard?: (card: BoardCard) => ReactNode
  footer?: ReactNode
  className?: string
}

function capacity(column: BoardColumn): { text: string; tone: ChipTone } {
  if (column.wipLimit === null) {
    return { text: `${column.activeCardCount} cards`, tone: 'default' }
  }

  const text = `${column.activeCardCount} / ${column.wipLimit}`

  if (column.activeCardCount > column.wipLimit) {
    return { text, tone: 'error' }
  }

  return { text, tone: column.activeCardCount === column.wipLimit ? 'warning' : 'default' }
}

export function ColumnLane({
  column,
  headerActions,
  renderCard,
  footer,
  className,
}: ColumnLaneProps) {
  const limit = capacity(column)
  const renderOne = renderCard ?? ((card: BoardCard) => <CardTile card={card} />)

  return (
    <Card variant="elevated" className={classNames('rb-lane', className)}>
      <div className="rb-lane__head">
        <h2 className="rb-lane__title">{column.title}</h2>
        <div className="rb-lane__meta">
          <StatusChip tone={limit.tone}>{limit.text}</StatusChip>
          {headerActions}
        </div>
      </div>

      {column.cards.length > 0 ? (
        <ul className="rb-lane__cards">
          {column.cards.map((card) => (
            <li key={card.id}>{renderOne(card)}</li>
          ))}
        </ul>
      ) : (
        <p className="rb-lane__empty">No cards</p>
      )}

      {footer}
    </Card>
  )
}
