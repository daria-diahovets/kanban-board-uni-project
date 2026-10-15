import { z } from 'zod'

const assignableRole = z.enum(['MEMBER', 'VIEWER'])

export const boardMembersParamsSchema = z.object({
  boardId: z.uuid(),
})

export const boardMemberParamsSchema = z.object({
  boardId: z.uuid(),
  userId: z.uuid(),
})

export const inviteMemberSchema = z.object({
  email: z.email().max(255),
  role: assignableRole.default('MEMBER'),
})

export const updateMemberRoleSchema = z.object({
  role: assignableRole,
})

export type BoardMemberParams = z.infer<typeof boardMemberParamsSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
