import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { Input } from '../../ui/Input/Input'
import { TextArea } from '../../ui/TextArea/TextArea'
import type { CardDetail } from '../../types/api'
import {
  fromDueDateInput,
  toDueDateInput,
  validateCardDescription,
  validateCardTitle,
  validateDueDate,
} from './cardRules'
import { useUpdateCard } from './useCard'
import type { CardScope } from './cardQueries'

type CardDetailsFormProps = {
  scope: CardScope
  card: CardDetail
  editable: boolean
}

export function CardDetailsForm({ scope, card, editable }: CardDetailsFormProps) {
  const updateCard = useUpdateCard(scope)
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
  const [dueDate, setDueDate] = useState(toDueDateInput(card.dueDate))
  const [titleError, setTitleError] = useState<string | undefined>(undefined)
  const [descriptionError, setDescriptionError] = useState<string | undefined>(undefined)
  const [dueDateError, setDueDateError] = useState<string | undefined>(undefined)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextTitleError = validateCardTitle(title)
    const nextDescriptionError = validateCardDescription(description)
    const nextDueDateError = validateDueDate(dueDate)

    setTitleError(nextTitleError)
    setDescriptionError(nextDescriptionError)
    setDueDateError(nextDueDateError)

    if (nextTitleError || nextDescriptionError || nextDueDateError) {
      return
    }

    updateCard.mutate({
      title: title.trim(),
      description: description.trim() || null,
      dueDate: fromDueDateInput(dueDate),
      version: card.version,
    })
  }

  return (
    <form className="rb-card-modal__form" onSubmit={submit} noValidate>
      {updateCard.error ? (
        <ErrorBanner error={updateCard.error} onDismiss={() => updateCard.reset()} />
      ) : null}
      <Input
        label="Title"
        name="title"
        value={title}
        disabled={!editable}
        errorText={titleError}
        onChange={(event) => setTitle(event.target.value)}
      />
      <TextArea
        label="Description"
        name="description"
        value={description}
        disabled={!editable}
        errorText={descriptionError}
        onChange={(event) => setDescription(event.target.value)}
      />
      <Input
        label="Due date"
        name="dueDate"
        type="date"
        value={dueDate}
        disabled={!editable}
        helperText="Leave empty for no due date"
        errorText={dueDateError}
        onChange={(event) => setDueDate(event.target.value)}
      />
      {editable ? (
        <Button type="submit" disabled={updateCard.isPending}>
          {updateCard.isPending ? 'Saving' : 'Save details'}
        </Button>
      ) : null}
    </form>
  )
}
