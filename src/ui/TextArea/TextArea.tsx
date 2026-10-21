import { useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { classNames } from '../../lib/classNames'
import '../Input/Input.css'
import './TextArea.css'

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: string
  id?: string
  helperText?: string
  errorText?: string
}

export function TextArea({
  label,
  id,
  helperText,
  errorText,
  className,
  rows = 4,
  ...rest
}: TextAreaProps) {
  const generatedId = useId()
  const textAreaId = id ?? generatedId
  const messageId = `${textAreaId}-message`
  const message = errorText ?? helperText

  return (
    <div className="rb-field">
      <label className="rb-field__label" htmlFor={textAreaId}>
        {label}
      </label>
      <textarea
        id={textAreaId}
        rows={rows}
        className={classNames(
          'rb-field__control',
          'rb-textarea',
          errorText && 'rb-field__control--error',
          className,
        )}
        aria-invalid={errorText ? true : undefined}
        aria-describedby={message ? messageId : undefined}
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
