import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { Checkbox } from '../../ui/Checkbox/Checkbox'
import { Input } from '../../ui/Input/Input'
import { Radio } from '../../ui/Radio/Radio'
import { StatusChip } from '../../ui/Chip/Chip'
import { Spinner } from '../../ui/Spinner/Spinner'
import { labelTone } from '../board/cardMeta'
import type { BoardLabel, Label, LabelColor } from '../../types/api'
import { validateLabelName } from './cardRules'
import { useBoardLabels, useCreateLabel, useDeleteLabel, useUpdateLabel } from './useBoardLabels'
import { useSetCardLabels } from './useCard'
import type { CardScope } from './cardQueries'

const LABEL_COLORS: LabelColor[] = ['BLACK', 'SUCCESS', 'WARNING', 'ERROR', 'INFO']

type LabelPickerProps = {
  scope: CardScope
  cardLabels: Label[]
  editable: boolean
}

type LabelDraft = {
  name: string
  colorToken: LabelColor
  error?: string
}

const emptyDraft: LabelDraft = { name: '', colorToken: 'BLACK' }

export function LabelPicker({ scope, cardLabels, editable }: LabelPickerProps) {
  const labels = useBoardLabels(scope.boardId)
  const setCardLabels = useSetCardLabels(scope)
  const createLabel = useCreateLabel(scope)
  const updateLabel = useUpdateLabel(scope)
  const deleteLabel = useDeleteLabel(scope)
  const [draft, setDraft] = useState<LabelDraft>(emptyDraft)
  const [editing, setEditing] = useState<(LabelDraft & { labelId: string }) | null>(null)

  const assignedIds = cardLabels.map((label) => label.id)
  const mutationError =
    setCardLabels.error ?? createLabel.error ?? updateLabel.error ?? deleteLabel.error

  function dismissErrors() {
    setCardLabels.reset()
    createLabel.reset()
    updateLabel.reset()
    deleteLabel.reset()
  }

  function toggle(labelId: string) {
    dismissErrors()
    setCardLabels.mutate(
      assignedIds.includes(labelId)
        ? assignedIds.filter((id) => id !== labelId)
        : [...assignedIds, labelId],
    )
  }

  function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const error = validateLabelName(draft.name)

    if (error) {
      setDraft({ ...draft, error })
      return
    }

    dismissErrors()
    createLabel.mutate(
      { name: draft.name.trim(), colorToken: draft.colorToken },
      { onSuccess: () => setDraft(emptyDraft) },
    )
  }

  function submitEditing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editing) {
      return
    }

    const error = validateLabelName(editing.name)

    if (error) {
      setEditing({ ...editing, error })
      return
    }

    dismissErrors()
    updateLabel.mutate(
      { labelId: editing.labelId, name: editing.name.trim(), colorToken: editing.colorToken },
      { onSuccess: () => setEditing(null) },
    )
  }

  function colorChoices(current: LabelColor, name: string, onPick: (color: LabelColor) => void) {
    return (
      <div className="rb-card-modal__options">
        {LABEL_COLORS.map((color) => (
          <Radio
            key={color}
            name={name}
            label={<StatusChip tone={labelTone(color)}>{color}</StatusChip>}
            value={color}
            checked={current === color}
            onChange={() => onPick(color)}
          />
        ))}
      </div>
    )
  }

  if (labels.isPending) {
    return <Spinner label="Loading labels" />
  }

  if (labels.isError) {
    return <ErrorBanner error={labels.error} onDismiss={() => void labels.refetch()} />
  }

  return (
    <div className="rb-card-modal__stack">
      {mutationError ? <ErrorBanner error={mutationError} onDismiss={dismissErrors} /> : null}

      {labels.data.length === 0 ? (
        <p className="rb-card-modal__note">This board has no labels yet</p>
      ) : (
        <ul className="rb-label-picker__list">
          {labels.data.map((label: BoardLabel) => (
            <li className="rb-label-picker__row" key={label.id}>
              <Checkbox
                label={<StatusChip tone={labelTone(label.colorToken)}>{label.name}</StatusChip>}
                checked={assignedIds.includes(label.id)}
                disabled={!editable || setCardLabels.isPending}
                onChange={() => toggle(label.id)}
              />
              {editable ? (
                <span className="rb-label-picker__actions">
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Rename label ${label.name}`}
                    onClick={() =>
                      setEditing({
                        labelId: label.id,
                        name: label.name,
                        colorToken: label.colorToken,
                      })
                    }
                  >
                    Rename
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    aria-label={`Delete label ${label.name}`}
                    disabled={deleteLabel.isPending}
                    onClick={() => {
                      dismissErrors()
                      deleteLabel.mutate(label.id)
                    }}
                  >
                    Delete
                  </Button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {editable && editing ? (
        <form className="rb-card-modal__form" onSubmit={submitEditing} noValidate>
          <Input
            label="Label name"
            name="editLabelName"
            value={editing.name}
            errorText={editing.error}
            onChange={(event) => setEditing({ ...editing, name: event.target.value })}
          />
          {colorChoices(editing.colorToken, `edit-label-color-${editing.labelId}`, (color) =>
            setEditing({ ...editing, colorToken: color }),
          )}
          <div className="rb-card-modal__row">
            <Button type="submit" size="sm" disabled={updateLabel.isPending}>
              {updateLabel.isPending ? 'Saving' : 'Save label'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {editable && !editing ? (
        <form className="rb-card-modal__form" onSubmit={submitDraft} noValidate>
          <Input
            label="New label"
            name="newLabelName"
            value={draft.name}
            errorText={draft.error}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
          {colorChoices(draft.colorToken, 'new-label-color', (color) =>
            setDraft({ ...draft, colorToken: color }),
          )}
          <Button type="submit" size="sm" disabled={createLabel.isPending}>
            {createLabel.isPending ? 'Adding' : 'Add label'}
          </Button>
        </form>
      ) : null}
    </div>
  )
}
