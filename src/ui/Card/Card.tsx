import type { HTMLAttributes, ReactNode } from 'react'
import { classNames } from '../../lib/classNames'
import './Card.css'

export type CardVariant = 'default' | 'elevated'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant
  children: ReactNode
}

export function Card({ variant = 'default', className, children, ...rest }: CardProps) {
  return (
    <div className={classNames('rb-card', `rb-card--${variant}`, className)} {...rest}>
      {children}
    </div>
  )
}
