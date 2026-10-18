import { prisma } from '../config/prisma'
import { ApiError } from '../lib/ApiError'
import { emitToBoard } from '../realtime/emit'
import { SERVER_EVENTS } from '../realtime/events'

const ADMIN_BOARD_SELECT = {
  id: true,
  title: true,
  description: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, email: true, fullName: true } },
  _count: { select: { members: true, columns: true } },
} as const

export async function listAllBoards() {
  return prisma.board.findMany({
    select: ADMIN_BOARD_SELECT,
    orderBy: [{ isArchived: 'asc' }, { updatedAt: 'desc' }],
  })
}

export async function transferBoardOwnership(boardId: string, newOwnerId: string, actorId: string) {
  const board = await prisma.$transaction(async (transaction) => {
    const board = await transaction.board.findUnique({
      where: { id: boardId },
      select: { ownerId: true },
    })

    if (!board) {
      throw ApiError.notFound('Board not found')
    }

    const newOwner = await transaction.user.findUnique({
      where: { id: newOwnerId },
      select: { id: true },
    })

    if (!newOwner) {
      throw ApiError.notFound('The new owner account does not exist')
    }

    if (board.ownerId === newOwnerId) {
      throw ApiError.conflict('This user already owns the board')
    }

    await transaction.boardMember.updateMany({
      where: { boardId, userId: board.ownerId },
      data: { role: 'MEMBER' },
    })

    await transaction.boardMember.upsert({
      where: { boardId_userId: { boardId, userId: newOwnerId } },
      create: { boardId, userId: newOwnerId, role: 'OWNER' },
      update: { role: 'OWNER' },
    })

    return transaction.board.update({
      where: { id: boardId },
      data: { ownerId: newOwnerId },
      select: ADMIN_BOARD_SELECT,
    })
  })

  emitToBoard(boardId, SERVER_EVENTS.boardUpdated, { actorId, board })

  return board
}
