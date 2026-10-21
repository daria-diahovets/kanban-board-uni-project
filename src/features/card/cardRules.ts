export const CARD_TITLE_MAX_LENGTH = 200
export const CARD_DESCRIPTION_MAX_LENGTH = 5000
export const COMMENT_MAX_LENGTH = 2000
export const CHECKLIST_TEXT_MAX_LENGTH = 200
export const LABEL_NAME_MAX_LENGTH = 40

function requiredText(value: string, field: string, maxLength: number) {
  const text = value.trim()

  if (text.length === 0) {
    return `${field} is required`
  }

  if (text.length > maxLength) {
    return `${field} must be at most ${maxLength} characters`
  }

  return undefined
}

export function validateCardTitle(value: string) {
  return requiredText(value, 'Title', CARD_TITLE_MAX_LENGTH)
}

export function validateCardDescription(value: string) {
  return value.trim().length > CARD_DESCRIPTION_MAX_LENGTH
    ? `Description must be at most ${CARD_DESCRIPTION_MAX_LENGTH} characters`
    : undefined
}

export function validateCommentBody(value: string) {
  return requiredText(value, 'Comment', COMMENT_MAX_LENGTH)
}

export function validateChecklistText(value: string) {
  return requiredText(value, 'Item', CHECKLIST_TEXT_MAX_LENGTH)
}

export function validateLabelName(value: string) {
  return requiredText(value, 'Name', LABEL_NAME_MAX_LENGTH)
}

export function validateDueDate(value: string) {
  if (value.length === 0) {
    return undefined
  }

  return Number.isNaN(new Date(value).getTime()) ? 'Due date is not a valid date' : undefined
}

export function toDueDateInput(dueDate: string | null) {
  if (!dueDate) {
    return ''
  }

  const date = new Date(dueDate)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

export function fromDueDateInput(value: string) {
  return value.length === 0 ? null : new Date(`${value}T12:00:00`).toISOString()
}

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
