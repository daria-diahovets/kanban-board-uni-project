import { useState } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { StatusChip } from '../../ui/Chip/Chip'
import { Input } from '../../ui/Input/Input'
import { Spinner } from '../../ui/Spinner/Spinner'
import { formatTimestamp } from '../card/cardRules'
import { shareLinkUrl, useCreateShareLink, useRevokeShareLink, useShareLink } from './useShareLink'

const MIN_EXPIRY_DAYS = 1
const MAX_EXPIRY_DAYS = 365

type ShareLinkPanelProps = {
  boardId: string
}

function validateExpiry(value: string) {
  const days = value.trim()

  if (days.length === 0) {
    return undefined
  }

  if (!/^\d+$/.test(days)) {
    return 'Days must be a whole number'
  }

  const parsed = Number(days)

  return parsed < MIN_EXPIRY_DAYS || parsed > MAX_EXPIRY_DAYS
    ? `Days must be between ${MIN_EXPIRY_DAYS} and ${MAX_EXPIRY_DAYS}`
    : undefined
}

export function ShareLinkPanel({ boardId }: ShareLinkPanelProps) {
  const shareLink = useShareLink(boardId, true)
  const createShareLink = useCreateShareLink(boardId)
  const revokeShareLink = useRevokeShareLink(boardId)
  const [expiresInDays, setExpiresInDays] = useState('')
  const [expiryError, setExpiryError] = useState<string | undefined>(undefined)

  const mutationError = createShareLink.error ?? revokeShareLink.error

  function dismissErrors() {
    createShareLink.reset()
    revokeShareLink.reset()
  }

  function create() {
    const error = validateExpiry(expiresInDays)
    setExpiryError(error)

    if (error) {
      return
    }

    dismissErrors()
    createShareLink.mutate(expiresInDays.trim().length === 0 ? null : Number(expiresInDays))
  }

  if (shareLink.isPending) {
    return <Spinner label="Loading share link" />
  }

  if (shareLink.isError) {
    return <ErrorBanner error={shareLink.error} onDismiss={() => void shareLink.refetch()} />
  }

  const link = shareLink.data

  return (
    <div className="rb-members">
      {mutationError ? <ErrorBanner error={mutationError} onDismiss={dismissErrors} /> : null}

      {link ? (
        <div className="rb-members__share">
          <StatusChip tone="success">Active</StatusChip>
          <a className="rb-members__link" href={shareLinkUrl(link.token)}>
            {shareLinkUrl(link.token)}
          </a>
          <p className="rb-members__meta">
            Created by {link.createdBy.fullName} · {formatTimestamp(link.createdAt)}
            {link.expiresAt ? ` · expires ${formatTimestamp(link.expiresAt)}` : ' · no expiry'}
          </p>
          <Button
            variant="destructive"
            size="sm"
            disabled={revokeShareLink.isPending}
            onClick={() => {
              dismissErrors()
              revokeShareLink.mutate(undefined)
            }}
          >
            {revokeShareLink.isPending ? 'Revoking' : 'Revoke link'}
          </Button>
        </div>
      ) : (
        <p className="rb-members__meta">This board has no active share link</p>
      )}

      <div className="rb-members__form">
        <Input
          label="Expires in days"
          name="expiresInDays"
          inputMode="numeric"
          value={expiresInDays}
          helperText="Leave empty for a link that never expires"
          errorText={expiryError}
          onChange={(event) => setExpiresInDays(event.target.value)}
        />
        <Button size="sm" disabled={createShareLink.isPending} onClick={create}>
          {createShareLink.isPending ? 'Creating' : link ? 'Replace link' : 'Create link'}
        </Button>
      </div>
    </div>
  )
}
