import { prisma } from '../config/prisma'
import { ApiError } from '../lib/ApiError'
import { normalizeEmail } from '../lib/email'
import type { InviteMemberInput, UpdateMemberRoleInput } from '../validators/member.validators'

const MEMBER_SELECT = {
  role: true,
  joinedAt: true,
  user: { select: { id: true, email: true, fullName: true } },
  invitedBy: { select: { id: true, fullName: true } },
} as const

async function loadMembershipForMutation(boardId: string, userId: string) {
  const [board, membership] = await Promise.all([
    prisma.board.findUnique({ where: { id: boardId }, select: { ownerId: true } }),
    prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
      select: { role: true },
    }),
  ])

  if (!board) {
    throw ApiError.notFound('Board not found')
  }

  if (!membership) {
    throw ApiError.notFound('This user is not a member of the board')
  }

  if (board.ownerId === userId) {
    throw ApiError.conflict('The board owner cannot be modified here, transfer ownership instead')
  }

  return membership
}

export async function listBoardMembers(boardId: string) {
  return prisma.boardMember.findMany({
    where: { boardId },
    select: MEMBER_SELECT,
    orderBy: { joinedAt: 'asc' },
  })
}

export async function inviteBoardMember(
  boardId: string,
  invitedById: string,
  input: InviteMemberInput,
) {
  const invitee = await prisma.user.findUnique({
    where: { email: normalizeEmail(input.email) },
    select: { id: true },
  })

  if (!invitee) {
    throw ApiError.notFound('No account is registered with this email')
  }

  const existingMembership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: invitee.id } },
    select: { role: true },
  })

  if (existingMembership) {
    throw ApiError.conflict('This user is already a member of the board')
  }

  return prisma.boardMember.create({
    data: { boardId, userId: invitee.id, role: input.role, invitedById },
    select: MEMBER_SELECT,
  })
}

export async function updateBoardMemberRole(
  boardId: string,
  userId: string,
  input: UpdateMemberRoleInput,
) {
  await loadMembershipForMutation(boardId, userId)

  return prisma.boardMember.update({
    where: { boardId_userId: { boardId, userId } },
    data: { role: input.role },
    select: MEMBER_SELECT,
  })
}

export async function removeBoardMember(boardId: string, userId: string) {
  await loadMembershipForMutation(boardId, userId)

  await prisma.boardMember.delete({ where: { boardId_userId: { boardId, userId } } })
}
