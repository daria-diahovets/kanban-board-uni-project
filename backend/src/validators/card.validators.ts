import { z } from 'zod'

export const columnCardsParamsSchema = z.object({
  columnId: z.uuid(),
})

export const cardParamsSchema = z.object({
  cardId: z.uuid(),
})

export const createCardSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  assigneeIds: z.array(z.uuid()).max(20).optional(),
})

export const updateCardSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    dueDate: z.coerce.date().nullable().optional(),
    isArchived: z.boolean().optional(),
    version: z.coerce.number().int().positive().optional(),
  })
  .refine((value) => Object.keys(value).some((key) => key !== 'version'), {
    message: 'At least one field besides version must be provided',
  })

export const setAssigneesSchema = z.object({
  userIds: z.array(z.uuid()).max(20),
})

export type ColumnCardsParams = z.infer<typeof columnCardsParamsSchema>
export type CardParams = z.infer<typeof cardParamsSchema>
export type CreateCardInput = z.infer<typeof createCardSchema>
export type UpdateCardInput = z.infer<typeof updateCardSchema>
export type SetAssigneesInput = z.infer<typeof setAssigneesSchema>
