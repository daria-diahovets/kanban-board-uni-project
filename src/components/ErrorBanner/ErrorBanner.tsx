import { ApiError } from '../../lib/apiClient'
import { Button } from '../../ui/Button/Button'
import { classNames } from '../../lib/classNames'
import './ErrorBanner.css'

type ErrorBannerProps = {
  error: unknown
  onDismiss?: () => void
  className?: string
}

function describe(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
}

export function ErrorBanner({ error, onDismiss, className }: ErrorBannerProps) {
  return (
    <div className={classNames('rb-error-banner', className)} role="alert">
      <p className="rb-error-banner__message">{describe(error)}</p>
      {onDismiss ? (
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      ) : null}
    </div>
  )
}
