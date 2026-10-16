import { z } from 'zod'

const wipLimit = z.coerce.number().int().min(1).max(999).nullable()

export const boardColumnsParamsSchema = z.object({
  boardId: z.uuid(),
})

export const columnParamsSchema = z.object({
  columnId: z.uuid(),
})

export const createColumnSchema = z.object({
  title: z.string().trim().min(1).max(80),
  wipLimit: wipLimit.optional(),
})

export const updateColumnSchema = z
  .object({
    title: z.string().trim().min(1).max(80).optional(),
    wipLimit: wipLimit.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  })

export type BoardColumnsParams = z.infer<typeof boardColumnsParamsSchema>
export type ColumnParams = z.infer<typeof columnParamsSchema>
export type CreateColumnInput = z.infer<typeof createColumnSchema>
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>
