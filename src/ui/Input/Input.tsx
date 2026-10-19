import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { classNames } from '../../lib/classNames'
import './Input.css'

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string
  id?: string
  helperText?: string
  errorText?: string
}

export function Input({
  label,
  id,
  helperText,
  errorText,
  className,
  required,
  ...rest
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`
  const message = errorText ?? helperText

  return (
    <div className="rb-field">
      <label className="rb-field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={classNames(
          'rb-field__control',
          errorText && 'rb-field__control--error',
          className,
        )}
        aria-invalid={errorText ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        required={required}
        {...rest}
      />
      {message ? (
        <p
          id={messageId}
          className={classNames('rb-field__message', errorText && 'rb-field__message--error')}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
