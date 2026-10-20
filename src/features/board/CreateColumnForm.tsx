import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { Card } from '../../ui/Card/Card'
import { Input } from '../../ui/Input/Input'
import { parseWipLimit, validateColumnTitle, validateWipLimit } from './columnRules'
import { useCreateColumn } from './useColumns'
import './CreateColumnForm.css'

type CreateColumnFormProps = {
  boardId: string
}

export function CreateColumnForm({ boardId }: CreateColumnFormProps) {
  const createColumn = useCreateColumn(boardId)
  const [title, setTitle] = useState('')
  const [wipLimit, setWipLimit] = useState('')
  const [titleError, setTitleError] = useState<string | undefined>(undefined)
  const [wipLimitError, setWipLimitError] = useState<string | undefined>(undefined)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextTitleError = validateColumnTitle(title)
    const nextWipLimitError = validateWipLimit(wipLimit)

    setTitleError(nextTitleError)
    setWipLimitError(nextWipLimitError)

    if (nextTitleError || nextWipLimitError) {
      return
    }

    createColumn.mutate(
      { title: title.trim(), wipLimit: parseWipLimit(wipLimit) },
      {
        onSuccess: () => {
          setTitle('')
          setWipLimit('')
        },
      },
    )
  }

  return (
    <Card className="rb-column-form">
      <h2 className="rb-column-form__heading">New column</h2>
      {createColumn.error ? (
        <ErrorBanner error={createColumn.error} onDismiss={() => createColumn.reset()} />
      ) : null}
      <form className="rb-column-form__fields" onSubmit={submit} noValidate>
        <Input
          label="Title"
          name="title"
          value={title}
          errorText={titleError}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Input
          label="Card limit"
          name="wipLimit"
          inputMode="numeric"
          value={wipLimit}
          helperText="Leave empty for no limit"
          errorText={wipLimitError}
          onChange={(event) => setWipLimit(event.target.value)}
        />
        <Button type="submit" disabled={createColumn.isPending}>
          {createColumn.isPending ? 'Adding' : 'Add column'}
        </Button>
      </form>
    </Card>
  )
}
