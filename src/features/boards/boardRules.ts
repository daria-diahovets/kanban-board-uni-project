const MAX_TITLE_LENGTH = 120
const MAX_DESCRIPTION_LENGTH = 2000

export function validateBoardTitle(value: string) {
  const title = value.trim()

  if (!title) {
    return 'Title is required'
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return `Title must be at most ${MAX_TITLE_LENGTH} characters`
  }

  return undefined
}

export function validateBoardDescription(value: string) {
  if (value.trim().length > MAX_DESCRIPTION_LENGTH) {
    return `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`
  }

  return undefined
}
