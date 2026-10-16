import { z } from 'zod'

export const boardIdParamsSchema = z.object({
  boardId: z.uuid(),
})

export const createBoardSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
})

export const updateBoardSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  })

export const archiveBoardSchema = z.object({
  isArchived: z.boolean(),
})

const blankAsAbsent = <Schema extends z.ZodType>(schema: Schema) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.optional(),
  )

export const boardQuerySchema = z.object({
  assigneeId: blankAsAbsent(z.uuid()),
  labelId: blankAsAbsent(z.uuid()),
  due: blankAsAbsent(z.enum(['overdue', 'today', 'week', 'none'])),
  q: blankAsAbsent(z.string().trim().max(200)),
  includeArchived: blankAsAbsent(z.enum(['true', 'false']).transform((value) => value === 'true')),
})

export type BoardIdParams = z.infer<typeof boardIdParamsSchema>
export type CreateBoardInput = z.infer<typeof createBoardSchema>
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>
export type ArchiveBoardInput = z.infer<typeof archiveBoardSchema>
export type BoardQuery = z.infer<typeof boardQuerySchema>
