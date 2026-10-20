import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { Input } from '../../ui/Input/Input'
import { Modal } from '../../ui/Modal/Modal'
import type { BoardColumn } from '../../types/api'
import { formatWipLimit, parseWipLimit, validateColumnTitle, validateWipLimit } from './columnRules'
import { useDeleteColumn, useUpdateColumn } from './useColumns'
import './ColumnControls.css'

type ColumnControlsProps = {
  boardId: string
  column: BoardColumn
}

type EditState = {
  title: string
  wipLimit: string
  titleError?: string
  wipLimitError?: string
}

export function ColumnControls({ boardId, column }: ColumnControlsProps) {
  const updateColumn = useUpdateColumn(boardId)
  const deleteColumn = useDeleteColumn(boardId)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function startEditing() {
    updateColumn.reset()
    setEdit({ title: column.title, wipLimit: formatWipLimit(column.wipLimit) })
  }

  function startDeleting() {
    deleteColumn.reset()
    setConfirmingDelete(true)
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!edit) {
      return
    }

    const titleError = validateColumnTitle(edit.title)
    const wipLimitError = validateWipLimit(edit.wipLimit)

    if (titleError || wipLimitError) {
      setEdit({ ...edit, titleError, wipLimitError })
      return
    }

    updateColumn.mutate(
      {
        columnId: column.id,
        title: edit.title.trim(),
        wipLimit: parseWipLimit(edit.wipLimit),
      },
      { onSuccess: () => setEdit(null) },
    )
  }

  const editFormId = `edit-column-${column.id}`

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        aria-label={`Edit column ${column.title}`}
        onClick={startEditing}
      >
        Edit
      </Button>
      <Button
        variant="destructive"
        size="sm"
        aria-label={`Delete column ${column.title}`}
        onClick={startDeleting}
      >
        Delete
      </Button>

      {edit ? (
        <Modal
          open
          title={`Edit ${column.title}`}
          onClose={() => setEdit(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button type="submit" form={editFormId} disabled={updateColumn.isPending}>
                {updateColumn.isPending ? 'Saving' : 'Save'}
              </Button>
            </>
          }
        >
          {updateColumn.error ? (
            <ErrorBanner error={updateColumn.error} onDismiss={() => updateColumn.reset()} />
          ) : null}
          <form
            id={editFormId}
            className="rb-column-controls__form"
            onSubmit={submitEdit}
            noValidate
          >
            <Input
              label="Title"
              name="title"
              value={edit.title}
              errorText={edit.titleError}
              onChange={(event) => setEdit({ ...edit, title: event.target.value })}
            />
            <Input
              label="Card limit"
              name="wipLimit"
              inputMode="numeric"
              value={edit.wipLimit}
              helperText="Leave empty for no limit"
              errorText={edit.wipLimitError}
              onChange={(event) => setEdit({ ...edit, wipLimit: event.target.value })}
            />
          </form>
        </Modal>
      ) : null}

      {confirmingDelete ? (
        <Modal
          open
          title={`Delete ${column.title}`}
          onClose={() => setConfirmingDelete(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
                Keep it
              </Button>
              <Button
                variant="destructive"
                disabled={deleteColumn.isPending}
                onClick={() =>
                  deleteColumn.mutate(
                    { columnId: column.id },
                    { onSuccess: () => setConfirmingDelete(false) },
                  )
                }
              >
                {deleteColumn.isPending ? 'Deleting' : 'Delete column'}
              </Button>
            </>
          }
        >
          {deleteColumn.error ? (
            <ErrorBanner error={deleteColumn.error} onDismiss={() => deleteColumn.reset()} />
          ) : null}
          <p className="rb-column-controls__warning">
            {column.activeCardCount > 0
              ? `${column.title} still holds ${column.activeCardCount} card${column.activeCardCount === 1 ? '' : 's'}. Move them to another column first.`
              : `${column.title} is empty and can be removed.`}
          </p>
        </Modal>
      ) : null}
    </>
  )
}
