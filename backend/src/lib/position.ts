import { Prisma } from '@prisma/client'

type Position = Prisma.Decimal

export const POSITION_STEP = 1024
export const POSITION_SCALE = 10

const MINIMUM_GAP = new Prisma.Decimal('0.000001')

export function toPosition(value: string | number | Position): Position {
  return new Prisma.Decimal(value)
}

export function firstPosition(): Position {
  return new Prisma.Decimal(POSITION_STEP)
}

export function positionBefore(next: Position): Position {
  return next.minus(POSITION_STEP).toDecimalPlaces(POSITION_SCALE)
}

export function positionAfter(previous: Position): Position {
  return previous.plus(POSITION_STEP).toDecimalPlaces(POSITION_SCALE)
}

export function midpoint(previous: Position, next: Position): Position {
  return previous.plus(next).dividedBy(2).toDecimalPlaces(POSITION_SCALE)
}

export function needsRebalance(previous: Position | null, next: Position | null): boolean {
  if (!previous || !next) {
    return false
  }

  return next.minus(previous).abs().lessThan(MINIMUM_GAP)
}

export function positionBetween(previous: Position | null, next: Position | null): Position {
  if (previous && next) {
    return midpoint(previous, next)
  }

  if (previous) {
    return positionAfter(previous)
  }

  if (next) {
    return positionBefore(next)
  }

  return firstPosition()
}

export function rebalancedPositions(count: number): Position[] {
  return Array.from(
    { length: count },
    (_, index) => new Prisma.Decimal((index + 1) * POSITION_STEP),
  )
}
