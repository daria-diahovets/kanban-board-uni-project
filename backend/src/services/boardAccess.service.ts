import type { BoardRole } from '@prisma/client'
import { prisma } from '../config/prisma'
import { ApiError } from '../lib/ApiError'

export const BOARD_ROLE_RANK: Record<BoardRole, number> = {
  VIEWER: 1,
  MEMBER: 2,
  OWNER: 3,
}

export type BoardAccess = {
  boardId: string
  role: BoardRole
  isArchived: boolean
  isOwner: boolean
  grantedByMembership: boolean
}

type AccessingUser = {
  id: string
  systemRole: 'USER' | 'ADMIN'
}

const BOARD_ID_RESOLVERS: Record<string, (id: string) => Promise<string | null>> = {
  boardId: async (id) => {
    const board = await prisma.board.findUnique({ where: { id }, select: { id: true } })
    return board?.id ?? null
  },
  columnId: async (id) => {
    const column = await prisma.column.findUnique({ where: { id }, select: { boardId: true } })
    return column?.boardId ?? null
  },
  cardId: async (id) => {
    const card = await prisma.card.findUnique({
      where: { id },
      select: { column: { select: { boardId: true } } },
    })
    return card?.column.boardId ?? null
  },
  commentId: async (id) => {
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { card: { select: { column: { select: { boardId: true } } } } },
    })
    return comment?.card.column.boardId ?? null
  },
  attachmentId: async (id) => {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      select: { card: { select: { column: { select: { boardId: true } } } } },
    })
    return attachment?.card.column.boardId ?? null
  },
  labelId: async (id) => {
    const label = await prisma.label.findUnique({ where: { id }, select: { boardId: true } })
    return label?.boardId ?? null
  },
  itemId: async (id) => {
    const item = await prisma.checklistItem.findUnique({
      where: { id },
      select: { card: { select: { column: { select: { boardId: true } } } } },
    })
    return item?.card.column.boardId ?? null
  },
}

export async function resolveBoardId(
  params: Record<string, string | string[] | undefined>,
): Promise<string> {
  for (const [paramName, resolve] of Object.entries(BOARD_ID_RESOLVERS)) {
    const value = params[paramName]

    if (typeof value !== 'string' || value.length === 0) {
      continue
    }

    const boardId = await resolve(value)

    if (!boardId) {
      throw ApiError.notFound('Board not found for the requested resource')
    }

    return boardId
  }

  throw ApiError.badRequest('Request does not identify a board')
}

export async function getBoardAccess(boardId: string, user: AccessingUser): Promise<BoardAccess> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true, ownerId: true, isArchived: true },
  })

  if (!board) {
    throw ApiError.notFound('Board not found')
  }

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
    select: { role: true },
  })

  if (membership) {
    return {
      boardId: board.id,
      role: membership.role,
      isArchived: board.isArchived,
      isOwner: board.ownerId === user.id,
      grantedByMembership: true,
    }
  }

  if (user.systemRole === 'ADMIN') {
    return {
      boardId: board.id,
      role: 'VIEWER',
      isArchived: board.isArchived,
      isOwner: false,
      grantedByMembership: false,
    }
  }

  throw ApiError.forbidden('You do not have access to this board')
}
