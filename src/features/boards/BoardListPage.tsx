import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { Input } from '../../ui/Input/Input'
import { Modal } from '../../ui/Modal/Modal'
import { Spinner } from '../../ui/Spinner/Spinner'
import type { BoardSummary } from '../../types/api'
import { useAuth } from '../auth/useAuth'
import { BoardTile } from './BoardTile'
import { CreateBoardForm } from './CreateBoardForm'
import { validateBoardDescription, validateBoardTitle } from './boardRules'
import { useArchiveBoard, useBoards, useDeleteBoard, useUpdateBoard } from './useBoards'
import './BoardListPage.css'

type EditState = {
  board: BoardSummary
  title: string
  description: string
  titleError?: string
  descriptionError?: string
}

export function BoardListPage() {
  const { user } = useAuth()
  const boards = useBoards()
  const updateBoard = useUpdateBoard()
  const archiveBoard = useArchiveBoard()
  const deleteBoard = useDeleteBoard()
  const [editState, setEditState] = useState<EditState | null>(null)
  const [boardToDelete, setBoardToDelete] = useState<BoardSummary | null>(null)

  const mutationError = updateBoard.error ?? archiveBoard.error ?? deleteBoard.error
  const busy = updateBoard.isPending || archiveBoard.isPending || deleteBoard.isPending

  function dismissMutationError() {
    updateBoard.reset()
    archiveBoard.reset()
    deleteBoard.reset()
  }

  function startEditing(board: BoardSummary) {
    dismissMutationError()
    setEditState({ board, title: board.title, description: board.description ?? '' })
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editState) {
      return
    }

    const titleError = validateBoardTitle(editState.title)
    const descriptionError = validateBoardDescription(editState.description)

    if (titleError || descriptionError) {
      setEditState({ ...editState, titleError, descriptionError })
      return
    }

    updateBoard.mutate(
      {
        boardId: editState.board.id,
        title: editState.title.trim(),
        description: editState.description.trim() || null,
      },
      { onSuccess: () => setEditState(null) },
    )
  }

  function confirmDelete() {
    if (!boardToDelete) {
      return
    }

    deleteBoard.mutate({ boardId: boardToDelete.id }, { onSuccess: () => setBoardToDelete(null) })
  }

  if (boards.isPending) {
    return (
      <div className="rb-boards__state">
        <Spinner label="Loading boards" />
      </div>
    )
  }

  if (boards.isError) {
    return (
      <div className="rb-boards__state">
        <ErrorBanner error={boards.error} onDismiss={() => void boards.refetch()} />
      </div>
    )
  }

  const active = boards.data.filter((board) => !board.isArchived)
  const archived = boards.data.filter((board) => board.isArchived)

  const renderTile = (board: BoardSummary) => (
    <BoardTile
      key={board.id}
      board={board}
      isOwner={board.owner.id === user?.id}
      busy={busy}
      onEdit={startEditing}
      onToggleArchive={(target) => {
        dismissMutationError()
        archiveBoard.mutate({ boardId: target.id, isArchived: !target.isArchived })
      }}
      onDelete={(target) => {
        dismissMutationError()
        setBoardToDelete(target)
      }}
    />
  )

  return (
    <div className="rb-boards">
      <h1 className="rb-boards__heading">Boards</h1>
      <CreateBoardForm />
      {mutationError ? (
        <ErrorBanner error={mutationError} onDismiss={dismissMutationError} />
      ) : null}

      {active.length > 0 ? (
        <ul className="rb-boards__grid">
          {active.map((board) => (
            <li key={board.id}>{renderTile(board)}</li>
          ))}
        </ul>
      ) : (
        <p className="rb-boards__empty">No boards yet</p>
      )}

      {archived.length > 0 ? (
        <section className="rb-boards__archived">
          <h2 className="rb-boards__subheading">Archived</h2>
          <ul className="rb-boards__grid">
            {archived.map((board) => (
              <li key={board.id}>{renderTile(board)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <Modal
        open={editState !== null}
        title="Edit board"
        onClose={() => setEditState(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditState(null)}>
              Cancel
            </Button>
            <Button type="submit" form="edit-board-form" disabled={updateBoard.isPending}>
              {updateBoard.isPending ? 'Saving' : 'Save'}
            </Button>
          </>
        }
      >
        {editState ? (
          <form id="edit-board-form" className="rb-boards__form" onSubmit={submitEdit} noValidate>
            <Input
              label="Title"
              name="title"
              value={editState.title}
              errorText={editState.titleError}
              onChange={(event) => setEditState({ ...editState, title: event.target.value })}
            />
            <Input
              label="Description"
              name="description"
              value={editState.description}
              errorText={editState.descriptionError}
              onChange={(event) => setEditState({ ...editState, description: event.target.value })}
            />
          </form>
        ) : null}
      </Modal>

      <Modal
        open={boardToDelete !== null}
        title="Delete board"
        onClose={() => setBoardToDelete(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setBoardToDelete(null)}>
              Keep it
            </Button>
            <Button variant="destructive" disabled={deleteBoard.isPending} onClick={confirmDelete}>
              {deleteBoard.isPending ? 'Deleting' : 'Delete for good'}
            </Button>
          </>
        }
      >
        <p className="rb-boards__warning">
          Deleting {boardToDelete?.title} removes its columns, cards, comments and attachments. This
          cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
