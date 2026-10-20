export const COLUMN_TITLE_MAX_LENGTH = 80
export const WIP_LIMIT_MIN = 1
export const WIP_LIMIT_MAX = 999

export function validateColumnTitle(value: string) {
  const title = value.trim()

  if (title.length === 0) {
    return 'Title is required'
  }

  if (title.length > COLUMN_TITLE_MAX_LENGTH) {
    return `Title must be at most ${COLUMN_TITLE_MAX_LENGTH} characters`
  }

  return undefined
}

export function validateWipLimit(value: string) {
  const limit = value.trim()

  if (limit.length === 0) {
    return undefined
  }

  if (!/^\d+$/.test(limit)) {
    return 'Limit must be a whole number'
  }

  const parsed = Number(limit)

  if (parsed < WIP_LIMIT_MIN || parsed > WIP_LIMIT_MAX) {
    return `Limit must be between ${WIP_LIMIT_MIN} and ${WIP_LIMIT_MAX}`
  }

  return undefined
}

export function parseWipLimit(value: string) {
  const limit = value.trim()

  return limit.length === 0 ? null : Number(limit)
}

export function formatWipLimit(limit: number | null) {
  return limit === null ? '' : String(limit)
}
