import type { ComponentProps, ReactNode } from 'react'
import { classNames } from '../../lib/classNames'
import './Button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classNames('rb-button', `rb-button--${variant}`, `rb-button--${size}`, className)}
      {...rest}
    >
      {children}
    </button>
  )
}
