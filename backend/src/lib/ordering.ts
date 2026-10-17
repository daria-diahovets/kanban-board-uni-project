import type { Prisma } from '@prisma/client'

export type OrderAnchor = {
  id: string
  position: Prisma.Decimal
  createdAt: Date
}

export const ASCENDING_POSITION_ORDER = [
  { position: 'asc' as const },
  { createdAt: 'asc' as const },
  { id: 'asc' as const },
]

export const DESCENDING_POSITION_ORDER = [
  { position: 'desc' as const },
  { createdAt: 'desc' as const },
  { id: 'desc' as const },
]

export function afterAnchor(anchor: OrderAnchor) {
  return {
    OR: [
      { position: { gt: anchor.position } },
      { position: anchor.position, createdAt: { gt: anchor.createdAt } },
      { position: anchor.position, createdAt: anchor.createdAt, id: { gt: anchor.id } },
    ],
  }
}

export function beforeAnchor(anchor: OrderAnchor) {
  return {
    OR: [
      { position: { lt: anchor.position } },
      { position: anchor.position, createdAt: { lt: anchor.createdAt } },
      { position: anchor.position, createdAt: anchor.createdAt, id: { lt: anchor.id } },
    ],
  }
}
