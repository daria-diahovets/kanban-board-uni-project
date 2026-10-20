import type { ChipTone } from '../../ui/Chip/Chip'
import type { LabelColor } from '../../types/api'

const LABEL_TONES: Record<LabelColor, ChipTone> = {
  BLACK: 'default',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
}

const dueDateFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export type DueState = {
  text: string
  tone: ChipTone
}

export function labelTone(color: LabelColor) {
  return LABEL_TONES[color]
}

export function initialsOf(fullName: string) {
  const letters = fullName
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')

  return letters.toUpperCase() || '??'
}

export function dueStateOf(dueDate: string | null, now = new Date()): DueState | null {
  if (!dueDate) {
    return null
  }

  const due = new Date(dueDate)
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)

  if (due.getTime() < startOfToday.getTime()) {
    return { text: `Overdue ${dueDateFormat.format(due)}`, tone: 'error' }
  }

  if (due.getTime() <= endOfToday.getTime()) {
    return { text: 'Due today', tone: 'warning' }
  }

  return { text: `Due ${dueDateFormat.format(due)}`, tone: 'default' }
}

export function cardCountSummary(counts: {
  comments: number
  attachments: number
  checklistItems: number
}) {
  const parts: string[] = []

  if (counts.comments > 0) {
    parts.push(`${counts.comments} comments`)
  }

  if (counts.attachments > 0) {
    parts.push(`${counts.attachments} files`)
  }

  if (counts.checklistItems > 0) {
    parts.push(`${counts.checklistItems} checks`)
  }

  return parts
}
