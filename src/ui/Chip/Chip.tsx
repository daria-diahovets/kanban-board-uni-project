import type { ReactNode } from 'react'
import { classNames } from '../../lib/classNames'
import './Chip.css'

export type ChipTone = 'default' | 'success' | 'warning' | 'error' | 'info'

type StatusChipProps = {
  tone?: ChipTone
  children: ReactNode
  className?: string
}

type FilterChipProps = {
  active?: boolean
  onToggle: () => void
  children: ReactNode
  className?: string
}

export function StatusChip({ tone = 'default', children, className }: StatusChipProps) {
  return (
    <span className={classNames('rb-chip', 'rb-chip--status', `rb-chip--${tone}`, className)}>
      {children}
    </span>
  )
}

export function FilterChip({ active = false, onToggle, children, className }: FilterChipProps) {
  return (
    <button
      type="button"
      className={classNames('rb-chip', 'rb-chip--filter', active && 'rb-chip--active', className)}
      aria-pressed={active}
      onClick={onToggle}
    >
      {children}
    </button>
  )
}
