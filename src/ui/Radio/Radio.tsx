import type { InputHTMLAttributes, ReactNode } from 'react'
import { classNames } from '../../lib/classNames'
import './Radio.css'

type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
  name: string
}

export function Radio({ label, className, ...rest }: RadioProps) {
  return (
    <label className={classNames('rb-radio', rest.disabled && 'rb-radio--disabled', className)}>
      <input className="rb-radio__input" type="radio" {...rest} />
      <span className="rb-radio__dot" aria-hidden="true" />
      <span className="rb-radio__label">{label}</span>
    </label>
  )
}
