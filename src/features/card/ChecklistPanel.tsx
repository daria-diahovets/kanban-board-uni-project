import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { Checkbox } from '../../ui/Checkbox/Checkbox'
import { Input } from '../../ui/Input/Input'
import { StatusChip } from '../../ui/Chip/Chip'
import { Spinner } from '../../ui/Spinner/Spinner'
import { validateChecklistText } from './cardRules'
import {
  useChecklist,
  useCreateChecklistItem,
  useDeleteChecklistItem,
  useUpdateChecklistItem,
} from './useChecklist'
import type { CardScope } from './cardQueries'

type ChecklistPanelProps = {
  scope: CardScope
  editable: boolean
}

export function ChecklistPanel({ scope, editable }: ChecklistPanelProps) {
  const checklist = useChecklist(scope.cardId)
  const createItem = useCreateChecklistItem(scope)
  const updateItem = useUpdateChecklistItem(scope)
  const deleteItem = useDeleteChecklistItem(scope)
  const [text, setText] = useState('')
  const [textError, setTextError] = useState<string | undefined>(undefined)
  const [renaming, setRenaming] = useState<{ itemId: string; text: string; error?: string } | null>(
    null,
  )

  const mutationError = createItem.error ?? updateItem.error ?? deleteItem.error

  function dismissErrors() {
    createItem.reset()
    updateItem.reset()
    deleteItem.reset()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const error = validateChecklistText(text)
    setTextError(error)

    if (error) {
      return
    }

    dismissErrors()
    createItem.mutate(text.trim(), { onSuccess: () => setText('') })
  }

  function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!renaming) {
      return
    }

    const error = validateChecklistText(renaming.text)

    if (error) {
      setRenaming({ ...renaming, error })
      return
    }

    dismissErrors()
    updateItem.mutate(
      { itemId: renaming.itemId, text: renaming.text.trim() },
      { onSuccess: () => setRenaming(null) },
    )
  }

  if (checklist.isPending) {
    return <Spinner label="Loading checklist" />
  }

  if (checklist.isError) {
    return <ErrorBanner error={checklist.error} onDismiss={() => void checklist.refetch()} />
  }

  const items = checklist.data
  const done = items.filter((item) => item.isDone).length

  return (
    <div className="rb-card-modal__stack">
      <div className="rb-card-modal__row">
        <StatusChip tone={items.length > 0 && done === items.length ? 'success' : 'default'}>
          {`${done} / ${items.length} done`}
        </StatusChip>
      </div>

      {mutationError ? <ErrorBanner error={mutationError} onDismiss={dismissErrors} /> : null}

      {items.length === 0 ? <p className="rb-card-modal__note">No checklist items yet</p> : null}

      <ul className="rb-card-modal__list">
        {items.map((item) => (
          <li className="rb-card-modal__list-row" key={item.id}>
            {renaming?.itemId === item.id ? (
              <form className="rb-card-modal__form" onSubmit={submitRename} noValidate>
                <Input
                  label="Item"
                  name="checklistText"
                  value={renaming.text}
                  errorText={renaming.error}
                  onChange={(event) => setRenaming({ ...renaming, text: event.target.value })}
                />
                <div className="rb-card-modal__row">
                  <Button type="submit" size="sm" disabled={updateItem.isPending}>
                    Save
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setRenaming(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <Checkbox
                  label={item.text}
                  checked={item.isDone}
                  disabled={!editable || updateItem.isPending}
                  onChange={() => {
                    dismissErrors()
                    updateItem.mutate({ itemId: item.id, isDone: !item.isDone })
                  }}
                />
                {editable ? (
                  <span className="rb-card-modal__row">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Rename item ${item.text}`}
                      onClick={() => setRenaming({ itemId: item.id, text: item.text })}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      aria-label={`Delete item ${item.text}`}
                      disabled={deleteItem.isPending}
                      onClick={() => {
                        dismissErrors()
                        deleteItem.mutate(item.id)
                      }}
                    >
                      Delete
                    </Button>
                  </span>
                ) : null}
              </>
            )}
          </li>
        ))}
      </ul>

      {editable ? (
        <form className="rb-card-modal__form" onSubmit={submit} noValidate>
          <Input
            label="New item"
            name="newChecklistItem"
            value={text}
            errorText={textError}
            onChange={(event) => setText(event.target.value)}
          />
          <Button type="submit" size="sm" disabled={createItem.isPending}>
            {createItem.isPending ? 'Adding' : 'Add item'}
          </Button>
        </form>
      ) : null}
    </div>
  )
}
