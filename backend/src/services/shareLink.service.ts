import { randomBytes } from 'node:crypto'
import { prisma } from '../config/prisma'
import { ApiError } from '../lib/ApiError'
import type { CreateShareLinkInput } from '../validators/shareLink.validators'

const SHARE_LINK_SELECT = {
  token: true,
  isActive: true,
  expiresAt: true,
  createdAt: true,
  createdBy: { select: { id: true, fullName: true } },
} as const

const TOKEN_BYTES = 32
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

function generateToken() {
  return randomBytes(TOKEN_BYTES).toString('base64url')
}

export async function getActiveShareLink(boardId: string) {
  return prisma.boardShareLink.findFirst({
    where: { boardId, isActive: true },
    select: SHARE_LINK_SELECT,
    orderBy: { createdAt: 'desc' },
  })
}

export async function createShareLink(
  boardId: string,
  createdById: string,
  input: CreateShareLinkInput,
) {
  const expiresAt =
    input.expiresInDays === undefined
      ? null
      : new Date(Date.now() + input.expiresInDays * MILLISECONDS_PER_DAY)

  return prisma.$transaction(async (transaction) => {
    await transaction.boardShareLink.updateMany({
      where: { boardId, isActive: true },
      data: { isActive: false },
    })

    return transaction.boardShareLink.create({
      data: { boardId, createdById, token: generateToken(), expiresAt },
      select: SHARE_LINK_SELECT,
    })
  })
}

export async function revokeShareLink(boardId: string) {
  const revoked = await prisma.boardShareLink.updateMany({
    where: { boardId, isActive: true },
    data: { isActive: false },
  })

  if (revoked.count === 0) {
    throw ApiError.notFound('This board has no active share link')
  }
}

export async function resolveShareToken(token: string) {
  const shareLink = await prisma.boardShareLink.findUnique({
    where: { token },
    select: { boardId: true, isActive: true, expiresAt: true },
  })

  if (!shareLink || !shareLink.isActive) {
    throw ApiError.notFound('This share link is not valid')
  }

  if (shareLink.expiresAt && shareLink.expiresAt.getTime() < Date.now()) {
    throw ApiError.notFound('This share link has expired')
  }

  return shareLink.boardId
}
