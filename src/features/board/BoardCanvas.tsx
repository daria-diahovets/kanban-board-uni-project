import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { CardModal } from '../card/CardModal'
import type { BoardColumn, BoardMembership } from '../../types/api'
import { CardTile } from './CardTile'
import { ColumnControls } from './ColumnControls'
import { ColumnLane } from './ColumnLane'
import { CreateCardForm } from './CreateCardForm'
import { CreateColumnForm } from './CreateColumnForm'
import { SortableColumnLane } from './SortableColumnLane'
import { columnIdOfCard, planCardMove, planColumnMove } from './boardReorder'
import { columnDragId, parseDragId } from './dragIds'
import type { DragTarget } from './dragIds'
import { useMoveCard, useMoveColumn } from './useBoardMoves'
import './BoardCanvas.css'

type BoardCanvasProps = {
  boardId: string
  columns: BoardColumn[]
  members: BoardMembership[]
  cardsEditable: boolean
  columnsManageable: boolean
  isBoardOwner: boolean
  filtered: boolean
}

const POINTER_ACTIVATION_DISTANCE = 5

export function BoardCanvas({
  boardId,
  columns,
  members,
  cardsEditable,
  columnsManageable,
  isBoardOwner,
  filtered,
}: BoardCanvasProps) {
  const moveCard = useMoveCard(boardId)
  const moveColumn = useMoveColumn(boardId)
  const [dragged, setDragged] = useState<DragTarget | null>(null)
  const [openCardId, setOpenCardId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: POINTER_ACTIVATION_DISTANCE },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const moveError = moveCard.error ?? moveColumn.error

  function dismissMoveError() {
    moveCard.reset()
    moveColumn.reset()
  }

  function handleDragStart(event: DragStartEvent) {
    setDragged(parseDragId(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragged(null)

    const active = parseDragId(event.active.id)
    const over = event.over ? parseDragId(event.over.id) : null

    if (!active || !over) {
      return
    }

    dismissMoveError()

    if (active.type === 'column') {
      const overColumnId = over.type === 'column' ? over.id : columnIdOfCard(columns, over.id)
      const plan = overColumnId ? planColumnMove(columns, active.id, overColumnId) : null

      if (plan) {
        moveColumn.mutate(plan)
      }

      return
    }

    const plan = planCardMove(columns, active.id, over)

    if (plan) {
      moveCard.mutate(plan)
    }
  }

  const draggedCard =
    dragged?.type === 'card'
      ? columns.flatMap((column) => column.cards).find((card) => card.id === dragged.id)
      : undefined
  const draggedColumn =
    dragged?.type === 'column' ? columns.find((column) => column.id === dragged.id) : undefined

  if (columns.length === 0) {
    return (
      <div className="rb-canvas">
        <p className="rb-canvas__empty">No columns yet</p>
        {columnsManageable ? <CreateColumnForm boardId={boardId} /> : null}
      </div>
    )
  }

  return (
    <div className="rb-canvas">
      {moveError ? <ErrorBanner error={moveError} onDismiss={dismissMoveError} /> : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragCancel={() => setDragged(null)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={columns.map((column) => columnDragId(column.id))}
          strategy={horizontalListSortingStrategy}
        >
          <ul className="rb-canvas__lanes">
            {columns.map((column) => (
              <li key={column.id}>
                <SortableColumnLane
                  column={column}
                  columnDraggable={columnsManageable}
                  cardsDraggable={cardsEditable}
                  onOpenCard={setOpenCardId}
                  filtered={filtered}
                  controls={
                    columnsManageable ? <ColumnControls boardId={boardId} column={column} /> : null
                  }
                  footer={
                    cardsEditable ? (
                      <CreateCardForm
                        boardId={boardId}
                        columnId={column.id}
                        columnTitle={column.title}
                        members={members}
                      />
                    ) : null
                  }
                />
              </li>
            ))}
            {columnsManageable ? (
              <li>
                <CreateColumnForm boardId={boardId} />
              </li>
            ) : null}
          </ul>
        </SortableContext>

        <DragOverlay>
          {draggedCard ? <CardTile card={draggedCard} className="rb-card-tile--dragging" /> : null}
          {draggedColumn ? (
            <ColumnLane column={draggedColumn} className="rb-lane--dragging" />
          ) : null}
        </DragOverlay>
      </DndContext>

      {openCardId ? (
        <CardModal
          boardId={boardId}
          cardId={openCardId}
          members={members}
          editable={cardsEditable}
          isBoardOwner={isBoardOwner}
          onClose={() => setOpenCardId(null)}
        />
      ) : null}
    </div>
  )
}
