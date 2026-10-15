import { z } from 'zod'

export const adminBoardParamsSchema = z.object({
  boardId: z.uuid(),
})

export const transferOwnershipSchema = z.object({
  newOwnerId: z.uuid(),
})

export type AdminBoardParams = z.infer<typeof adminBoardParamsSchema>
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>
