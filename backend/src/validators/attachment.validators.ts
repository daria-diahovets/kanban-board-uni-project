import { z } from 'zod'

export const cardAttachmentsParamsSchema = z.object({
  cardId: z.uuid(),
})

export const attachmentParamsSchema = z.object({
  attachmentId: z.uuid(),
})

export type CardAttachmentsParams = z.infer<typeof cardAttachmentsParamsSchema>
export type AttachmentParams = z.infer<typeof attachmentParamsSchema>
