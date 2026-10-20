import type { ReactNode } from 'react'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '../../ui/Button/Button'
import { classNames } from '../../lib/classNames'
import type { BoardColumn } from '../../types/api'
import { ColumnLane } from './ColumnLane'
import { SortableCardTile } from './SortableCardTile'
import { cardDragId, columnDragId } from './dragIds'

type SortableColumnLaneProps = {
  column: BoardColumn
  columnDraggable: boolean
  cardsDraggable: boolean
  controls?: ReactNode
}

export function SortableColumnLane({
  column,
  columnDraggable,
  cardsDraggable,
  controls,
}: SortableColumnLaneProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: columnDragId(column.id),
    disabled: { draggable: !columnDraggable, droppable: false },
  })

  return (
    <div
      ref={setNodeRef}
      className={classNames('rb-sortable', isDragging && 'rb-sortable--dragging')}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
      }}
    >
      <SortableContext
        items={column.cards.map((card) => cardDragId(card.id))}
        strategy={verticalListSortingStrategy}
      >
        <ColumnLane
          column={column}
          headerActions={
            <>
              {columnDraggable ? (
                <Button
                  ref={setActivatorNodeRef}
                  variant="secondary"
                  size="sm"
                  aria-label={`Move column ${column.title}`}
                  {...attributes}
                  {...listeners}
                >
                  Move
                </Button>
              ) : null}
              {controls}
            </>
          }
          renderCard={(card) => <SortableCardTile card={card} draggable={cardsDraggable} />}
        />
      </SortableContext>
    </div>
  )
}
