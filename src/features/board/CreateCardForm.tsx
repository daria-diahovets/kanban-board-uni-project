import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { Checkbox } from '../../ui/Checkbox/Checkbox'
import { Input } from '../../ui/Input/Input'
import type { BoardMembership } from '../../types/api'
import { fromDueDateInput, validateCardTitle, validateDueDate } from '../card/cardRules'
import { useCreateCard } from './useCards'
import './CreateCardForm.css'

type CreateCardFormProps = {
  boardId: string
  columnId: string
  columnTitle: string
  members: BoardMembership[]
}

export function CreateCardForm({ boardId, columnId, columnTitle, members }: CreateCardFormProps) {
  const createCard = useCreateCard(boardId)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [titleError, setTitleError] = useState<string | undefined>(undefined)
  const [dueDateError, setDueDateError] = useState<string | undefined>(undefined)
  const [expanded, setExpanded] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextTitleError = validateCardTitle(title)
    const nextDueDateError = validateDueDate(dueDate)

    setTitleError(nextTitleError)
    setDueDateError(nextDueDateError)

    if (nextTitleError || nextDueDateError) {
      return
    }

    createCard.mutate(
      { columnId, title: title.trim(), dueDate: fromDueDateInput(dueDate), assigneeIds },
      {
        onSuccess: () => {
          setTitle('')
          setDueDate('')
          setAssigneeIds([])
        },
      },
    )
  }

  function toggleAssignee(userId: string) {
    setAssigneeIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    )
  }

  return (
    <form className="rb-card-form" onSubmit={submit} noValidate>
      {createCard.error ? (
        <ErrorBanner error={createCard.error} onDismiss={() => createCard.reset()} />
      ) : null}

      <Input
        label={`New card in ${columnTitle}`}
        name="cardTitle"
        value={title}
        errorText={titleError}
        onChange={(event) => setTitle(event.target.value)}
      />

      {expanded ? (
        <>
          <Input
            label="Due date"
            name="cardDueDate"
            type="date"
            value={dueDate}
            errorText={dueDateError}
            onChange={(event) => setDueDate(event.target.value)}
          />
          {members.length > 0 ? (
            <fieldset className="rb-card-form__assignees">
              <legend className="rb-field__label">Assignees</legend>
              {members.map((member) => (
                <Checkbox
                  key={member.user.id}
                  label={member.user.fullName}
                  checked={assigneeIds.includes(member.user.id)}
                  onChange={() => toggleAssignee(member.user.id)}
                />
              ))}
            </fieldset>
          ) : null}
        </>
      ) : null}

      <div className="rb-card-form__actions">
        <Button type="submit" size="sm" disabled={createCard.isPending}>
          {createCard.isPending ? 'Adding' : 'Add card'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Fewer fields' : 'More fields'}
        </Button>
      </div>
    </form>
  )
}
