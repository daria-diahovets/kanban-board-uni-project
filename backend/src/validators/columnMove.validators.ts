import { z } from 'zod'

export const moveColumnSchema = z.object({
  prevColumnId: z.uuid().nullable().optional(),
  nextColumnId: z.uuid().nullable().optional(),
})

export type MoveColumnInput = z.infer<typeof moveColumnSchema>
