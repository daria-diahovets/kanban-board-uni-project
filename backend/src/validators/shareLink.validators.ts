import { z } from 'zod'

export const shareLinkBoardParamsSchema = z.object({
  boardId: z.uuid(),
})

export const createShareLinkSchema = z.object({
  expiresInDays: z.coerce.number().int().min(1).max(365).optional(),
})

export const publicBoardParamsSchema = z.object({
  token: z
    .string()
    .min(20)
    .max(100)
    .regex(/^[A-Za-z0-9_-]+$/),
})

export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>
export type PublicBoardParams = z.infer<typeof publicBoardParamsSchema>
