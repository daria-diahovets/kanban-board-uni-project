import { prisma } from '../config/prisma'
import { ApiError } from '../lib/ApiError'
import type { CreateBoardInput, UpdateBoardInput } from '../validators/board.validators'

const BOARD_SUMMARY_SELECT = {
  id: true,
  title: true,
  description: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, email: true, fullName: true } },
  _count: { select: { members: true, columns: true } },
} as const

const BOARD_DETAIL_SELECT = {
  id: true,
  title: true,
  description: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, email: true, fullName: true } },
  members: {
    select: {
      role: true,
      joinedAt: true,
      user: { select: { id: true, email: true, fullName: true } },
    },
    orderBy: { joinedAt: 'asc' },
  },
  labels: {
    select: { id: true, name: true, colorToken: true },
    orderBy: { name: 'asc' },
  },
  _count: { select: { columns: true } },
} as const

export async function listBoardsForUser(userId: string) {
  return prisma.board.findMany({
    where: { members: { some: { userId } } },
    select: BOARD_SUMMARY_SELECT,
    orderBy: [{ isArchived: 'asc' }, { updatedAt: 'desc' }],
  })
}

export async function getBoardDetail(boardId: string) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: BOARD_DETAIL_SELECT,
  })

  if (!board) {
    throw ApiError.notFound('Board not found')
  }

  return board
}

export async function createBoard(ownerId: string, input: CreateBoardInput) {
  const board = await prisma.board.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      ownerId,
      members: {
        create: { userId: ownerId, role: 'OWNER' },
      },
    },
    select: BOARD_SUMMARY_SELECT,
  })

  return board
}

export async function updateBoard(boardId: string, input: UpdateBoardInput) {
  return prisma.board.update({
    where: { id: boardId },
    data: {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.description === undefined ? {} : { description: input.description }),
    },
    select: BOARD_SUMMARY_SELECT,
  })
}

export async function setBoardArchived(boardId: string, isArchived: boolean) {
  return prisma.board.update({
    where: { id: boardId },
    data: { isArchived },
    select: BOARD_SUMMARY_SELECT,
  })
}

export async function deleteBoard(boardId: string) {
  await prisma.board.delete({ where: { id: boardId } })
}
