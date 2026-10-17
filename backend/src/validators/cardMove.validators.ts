import { z } from 'zod'

export const moveCardSchema = z.object({
  targetColumnId: z.uuid(),
  prevCardId: z.uuid().nullable().optional(),
  nextCardId: z.uuid().nullable().optional(),
})

export type MoveCardInput = z.infer<typeof moveCardSchema>
