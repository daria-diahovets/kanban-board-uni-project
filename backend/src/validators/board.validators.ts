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

export type BoardIdParams = z.infer<typeof boardIdParamsSchema>
export type CreateBoardInput = z.infer<typeof createBoardSchema>
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>
export type ArchiveBoardInput = z.infer<typeof archiveBoardSchema>
