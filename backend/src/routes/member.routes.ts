import { Router } from 'express'
import {
  listMembers,
  patchMemberRole,
  postMember,
  removeMember,
} from '../controllers/member.controller'
import { authorizeBoard } from '../middleware/authorizeBoard'
import { validate } from '../middleware/validate'
import {
  boardMemberParamsSchema,
  boardMembersParamsSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from '../validators/member.validators'

export const memberRouter = Router({ mergeParams: true })

memberRouter.get(
  '/',
  validate({ params: boardMembersParamsSchema }),
  authorizeBoard('VIEWER'),
  listMembers,
)

memberRouter.post(
  '/',
  validate({ params: boardMembersParamsSchema, body: inviteMemberSchema }),
  authorizeBoard('OWNER'),
  postMember,
)

memberRouter.patch(
  '/:userId',
  validate({ params: boardMemberParamsSchema, body: updateMemberRoleSchema }),
  authorizeBoard('OWNER'),
  patchMemberRole,
)

memberRouter.delete(
  '/:userId',
  validate({ params: boardMemberParamsSchema }),
  authorizeBoard('OWNER'),
  removeMember,
)
