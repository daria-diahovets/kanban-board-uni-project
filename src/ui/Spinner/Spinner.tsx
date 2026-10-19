import { classNames } from '../../lib/classNames'
import './Spinner.css'

type SpinnerProps = {
  label?: string
  className?: string
}

export function Spinner({ label = 'Loading', className }: SpinnerProps) {
  return (
    <span className={classNames('rb-spinner', className)} role="status">
      <span className="rb-spinner__block" aria-hidden="true" />
      <span className="rb-spinner__label">{label}</span>
    </span>
  )
}
