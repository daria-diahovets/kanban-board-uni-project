import type { RequestHandler } from 'express'
import { requireUser } from '../middleware/authenticate'
import { requireBoardAccess } from '../middleware/authorizeBoard'
import {
  inviteBoardMember,
  listBoardMembers,
  removeBoardMember,
  updateBoardMemberRole,
} from '../services/member.service'
import type {
  BoardMemberParams,
  InviteMemberInput,
  UpdateMemberRoleInput,
} from '../validators/member.validators'

export const listMembers: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  const members = await listBoardMembers(boardId)
  response.json({ members })
}

export const postMember: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  const member = await inviteBoardMember(
    boardId,
    requireUser(request).id,
    request.validated.body as InviteMemberInput,
  )
  response.status(201).json({ member })
}

export const patchMemberRole: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  const { userId } = request.validated.params as BoardMemberParams
  const member = await updateBoardMemberRole(
    boardId,
    userId,
    request.validated.body as UpdateMemberRoleInput,
  )
  response.json({ member })
}

export const removeMember: RequestHandler = async (request, response) => {
  const { boardId } = requireBoardAccess(request)
  const { userId } = request.validated.params as BoardMemberParams
  await removeBoardMember(boardId, userId)
  response.status(204).send()
}
