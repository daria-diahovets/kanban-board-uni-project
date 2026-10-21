import { useRef, useState } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { Spinner } from '../../ui/Spinner/Spinner'
import { formatFileSize, formatTimestamp } from './cardRules'
import {
  downloadAttachment,
  useAttachments,
  useDeleteAttachment,
  useUploadAttachment,
} from './useAttachments'
import type { CardScope } from './cardQueries'

type AttachmentPanelProps = {
  scope: CardScope
  editable: boolean
}

export function AttachmentPanel({ scope, editable }: AttachmentPanelProps) {
  const attachments = useAttachments(scope.cardId)
  const uploadAttachment = useUploadAttachment(scope)
  const deleteAttachment = useDeleteAttachment(scope)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [downloadError, setDownloadError] = useState<unknown>(null)

  const mutationError = uploadAttachment.error ?? deleteAttachment.error ?? downloadError

  function dismissErrors() {
    uploadAttachment.reset()
    deleteAttachment.reset()
    setDownloadError(null)
  }

  if (attachments.isPending) {
    return <Spinner label="Loading attachments" />
  }

  if (attachments.isError) {
    return <ErrorBanner error={attachments.error} onDismiss={() => void attachments.refetch()} />
  }

  return (
    <div className="rb-card-modal__stack">
      {mutationError ? <ErrorBanner error={mutationError} onDismiss={dismissErrors} /> : null}

      {attachments.data.length === 0 ? (
        <p className="rb-card-modal__note">No files attached</p>
      ) : (
        <ul className="rb-card-modal__list">
          {attachments.data.map((attachment) => (
            <li className="rb-card-modal__list-row" key={attachment.id}>
              <span className="rb-attachment__facts">
                <span className="rb-attachment__name">{attachment.fileName}</span>
                <span className="rb-attachment__meta">
                  {formatFileSize(attachment.sizeBytes)} · {attachment.uploadedBy.fullName} ·{' '}
                  {formatTimestamp(attachment.createdAt)}
                </span>
              </span>
              <span className="rb-card-modal__row">
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={`Download ${attachment.fileName}`}
                  onClick={() => {
                    dismissErrors()
                    downloadAttachment(attachment).catch((error: unknown) =>
                      setDownloadError(error),
                    )
                  }}
                >
                  Download
                </Button>
                {editable ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    aria-label={`Delete ${attachment.fileName}`}
                    disabled={deleteAttachment.isPending}
                    onClick={() => {
                      dismissErrors()
                      deleteAttachment.mutate(attachment.id)
                    }}
                  >
                    Delete
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      {editable ? (
        <div className="rb-attachment__upload">
          <label className="rb-field__label" htmlFor={`attachment-${scope.cardId}`}>
            Attach a file
          </label>
          <input
            id={`attachment-${scope.cardId}`}
            ref={fileInputRef}
            className="rb-attachment__input"
            type="file"
            disabled={uploadAttachment.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0]

              if (!file) {
                return
              }

              dismissErrors()
              uploadAttachment.mutate(file, {
                onSettled: () => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                },
              })
            }}
          />
          {uploadAttachment.isPending ? <Spinner label="Uploading" /> : null}
        </div>
      ) : null}
    </div>
  )
}
