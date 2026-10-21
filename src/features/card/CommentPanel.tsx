import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { Spinner } from '../../ui/Spinner/Spinner'
import { TextArea } from '../../ui/TextArea/TextArea'
import { useAuth } from '../auth/useAuth'
import { formatTimestamp, validateCommentBody } from './cardRules'
import { useComments, useCreateComment, useDeleteComment, useUpdateComment } from './useComments'
import type { CardScope } from './cardQueries'

type CommentPanelProps = {
  scope: CardScope
  editable: boolean
  isBoardOwner: boolean
}

export function CommentPanel({ scope, editable, isBoardOwner }: CommentPanelProps) {
  const { user } = useAuth()
  const comments = useComments(scope.cardId)
  const createComment = useCreateComment(scope)
  const updateComment = useUpdateComment(scope)
  const deleteComment = useDeleteComment(scope)
  const [body, setBody] = useState('')
  const [bodyError, setBodyError] = useState<string | undefined>(undefined)
  const [editing, setEditing] = useState<{
    commentId: string
    body: string
    error?: string
  } | null>(null)

  const mutationError = createComment.error ?? updateComment.error ?? deleteComment.error

  function dismissErrors() {
    createComment.reset()
    updateComment.reset()
    deleteComment.reset()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const error = validateCommentBody(body)
    setBodyError(error)

    if (error) {
      return
    }

    dismissErrors()
    createComment.mutate(body.trim(), { onSuccess: () => setBody('') })
  }

  function submitEditing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editing) {
      return
    }

    const error = validateCommentBody(editing.body)

    if (error) {
      setEditing({ ...editing, error })
      return
    }

    dismissErrors()
    updateComment.mutate(
      { commentId: editing.commentId, body: editing.body.trim() },
      { onSuccess: () => setEditing(null) },
    )
  }

  if (comments.isPending) {
    return <Spinner label="Loading comments" />
  }

  if (comments.isError) {
    return <ErrorBanner error={comments.error} onDismiss={() => void comments.refetch()} />
  }

  return (
    <div className="rb-card-modal__stack">
      {mutationError ? <ErrorBanner error={mutationError} onDismiss={dismissErrors} /> : null}

      {comments.data.length === 0 ? (
        <p className="rb-card-modal__note">No comments yet</p>
      ) : (
        <ul className="rb-card-modal__list">
          {comments.data.map((comment) => {
            const isAuthor = comment.author.id === user?.id

            return (
              <li className="rb-comment" key={comment.id}>
                <p className="rb-comment__meta">
                  {comment.author.fullName} · {formatTimestamp(comment.createdAt)}
                  {comment.updatedAt !== comment.createdAt ? ' · edited' : ''}
                </p>
                {editing?.commentId === comment.id ? (
                  <form className="rb-card-modal__form" onSubmit={submitEditing} noValidate>
                    <TextArea
                      label="Comment"
                      name="commentBody"
                      rows={3}
                      value={editing.body}
                      errorText={editing.error}
                      onChange={(event) => setEditing({ ...editing, body: event.target.value })}
                    />
                    <div className="rb-card-modal__row">
                      <Button type="submit" size="sm" disabled={updateComment.isPending}>
                        Save
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="rb-comment__body">{comment.body}</p>
                    {editable ? (
                      <div className="rb-card-modal__row">
                        {isAuthor ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            aria-label="Edit your comment"
                            onClick={() =>
                              setEditing({ commentId: comment.id, body: comment.body })
                            }
                          >
                            Edit
                          </Button>
                        ) : null}
                        {isAuthor || isBoardOwner ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            aria-label={`Delete comment by ${comment.author.fullName}`}
                            disabled={deleteComment.isPending}
                            onClick={() => {
                              dismissErrors()
                              deleteComment.mutate(comment.id)
                            }}
                          >
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {editable ? (
        <form className="rb-card-modal__form" onSubmit={submit} noValidate>
          <TextArea
            label="New comment"
            name="newComment"
            rows={3}
            value={body}
            errorText={bodyError}
            onChange={(event) => setBody(event.target.value)}
          />
          <Button type="submit" size="sm" disabled={createComment.isPending}>
            {createComment.isPending ? 'Posting' : 'Post comment'}
          </Button>
        </form>
      ) : null}
    </div>
  )
}
