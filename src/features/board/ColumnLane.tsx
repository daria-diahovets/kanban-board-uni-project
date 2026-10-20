import { Card } from '../../ui/Card/Card'
import { StatusChip } from '../../ui/Chip/Chip'
import type { ChipTone } from '../../ui/Chip/Chip'
import type { BoardColumn } from '../../types/api'
import { CardTile } from './CardTile'
import './ColumnLane.css'

type ColumnLaneProps = {
  column: BoardColumn
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

export function ColumnLane({ column }: ColumnLaneProps) {
  const limit = capacity(column)

  return (
    <Card variant="elevated" className="rb-lane">
      <div className="rb-lane__head">
        <h2 className="rb-lane__title">{column.title}</h2>
        <StatusChip tone={limit.tone}>{limit.text}</StatusChip>
      </div>

      {column.cards.length > 0 ? (
        <ul className="rb-lane__cards">
          {column.cards.map((card) => (
            <li key={card.id}>
              <CardTile card={card} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rb-lane__empty">No cards</p>
      )}
    </Card>
  )
}
