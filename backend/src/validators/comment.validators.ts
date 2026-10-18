import { z } from 'zod'

export const cardCommentsParamsSchema = z.object({
  cardId: z.uuid(),
})

export const commentParamsSchema = z.object({
  commentId: z.uuid(),
})

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
})

export const updateCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
})

export type CardCommentsParams = z.infer<typeof cardCommentsParamsSchema>
export type CommentParams = z.infer<typeof commentParamsSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
