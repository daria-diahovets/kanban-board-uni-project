import { z } from 'zod'

const colorToken = z.enum(['BLACK', 'SUCCESS', 'WARNING', 'ERROR', 'INFO'])

export const boardLabelsParamsSchema = z.object({
  boardId: z.uuid(),
})

export const labelParamsSchema = z.object({
  labelId: z.uuid(),
})

export const createLabelSchema = z.object({
  name: z.string().trim().min(1).max(40),
  colorToken: colorToken.default('BLACK'),
})

export const updateLabelSchema = z
  .object({
    name: z.string().trim().min(1).max(40).optional(),
    colorToken: colorToken.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  })

export const setCardLabelsSchema = z.object({
  labelIds: z.array(z.uuid()).max(20),
})

export type BoardLabelsParams = z.infer<typeof boardLabelsParamsSchema>
export type LabelParams = z.infer<typeof labelParamsSchema>
export type CreateLabelInput = z.infer<typeof createLabelSchema>
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>
export type SetCardLabelsInput = z.infer<typeof setCardLabelsSchema>
