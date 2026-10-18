import { z } from 'zod'

export const cardChecklistParamsSchema = z.object({
  cardId: z.uuid(),
})

export const checklistItemParamsSchema = z.object({
  itemId: z.uuid(),
})

export const createChecklistItemSchema = z.object({
  text: z.string().trim().min(1).max(200),
  isDone: z.boolean().default(false),
})

export const updateChecklistItemSchema = z
  .object({
    text: z.string().trim().min(1).max(200).optional(),
    isDone: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  })

export type CardChecklistParams = z.infer<typeof cardChecklistParamsSchema>
export type ChecklistItemParams = z.infer<typeof checklistItemParamsSchema>
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>
