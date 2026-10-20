const POSITION_STEP = 1024

export function positionValue(position: string) {
  return Number(position)
}

export function positionBetween(previous: string | null, next: string | null) {
  if (previous === null && next === null) {
    return String(POSITION_STEP)
  }

  if (previous === null) {
    return String(positionValue(next as string) - POSITION_STEP)
  }

  if (next === null) {
    return String(positionValue(previous) + POSITION_STEP)
  }

  return String((positionValue(previous) + positionValue(next)) / 2)
}
