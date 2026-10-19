import type { InputHTMLAttributes, ReactNode } from 'react'
import { classNames } from '../../lib/classNames'
import './Checkbox.css'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
}

export function Checkbox({ label, className, ...rest }: CheckboxProps) {
  return (
    <label
      className={classNames('rb-checkbox', rest.disabled && 'rb-checkbox--disabled', className)}
    >
      <input className="rb-checkbox__input" type="checkbox" {...rest} />
      <span className="rb-checkbox__box" aria-hidden="true" />
      <span className="rb-checkbox__label">{label}</span>
    </label>
  )
}
