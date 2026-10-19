import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { Input } from '../../ui/Input/Input'
import { validateBoardDescription, validateBoardTitle } from './boardRules'
import { useCreateBoard } from './useBoards'
import './CreateBoardForm.css'

type FieldErrors = {
  title?: string
  description?: string
}

export function CreateBoardForm() {
  const createBoard = useCreateBoard()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors: FieldErrors = {
      title: validateBoardTitle(title),
      description: validateBoardDescription(description),
    }

    setFieldErrors(errors)

    if (errors.title || errors.description) {
      return
    }

    createBoard.mutate(
      {
        title: title.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
      },
      {
        onSuccess: () => {
          setTitle('')
          setDescription('')
        },
      },
    )
  }

  return (
    <form className="rb-create-board" onSubmit={handleSubmit} noValidate>
      {createBoard.error ? (
        <ErrorBanner error={createBoard.error} onDismiss={() => createBoard.reset()} />
      ) : null}
      <div className="rb-create-board__fields">
        <Input
          label="New board"
          name="title"
          placeholder="Release plan"
          value={title}
          errorText={fieldErrors.title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Input
          label="Description"
          name="description"
          placeholder="Optional"
          value={description}
          errorText={fieldErrors.description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <Button type="submit" disabled={createBoard.isPending}>
        {createBoard.isPending ? 'Creating' : 'Create board'}
      </Button>
    </form>
  )
}
