import { useSortable } from '@dnd-kit/sortable'
import { classNames } from '../../lib/classNames'
import type { BoardCard } from '../../types/api'
import { CardTile } from './CardTile'
import { cardDragId } from './dragIds'

type SortableCardTileProps = {
  card: BoardCard
  draggable: boolean
  onOpen?: (cardId: string) => void
}

export function SortableCardTile({ card, draggable, onOpen }: SortableCardTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cardDragId(card.id),
    disabled: { draggable: !draggable, droppable: false },
  })

  return (
    <div
      ref={setNodeRef}
      className={classNames(
        'rb-sortable',
        draggable && 'rb-sortable--draggable',
        isDragging && 'rb-sortable--dragging',
      )}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
      }}
      {...attributes}
      {...listeners}
    >
      <CardTile card={card} onOpen={onOpen} />
    </div>
  )
}
