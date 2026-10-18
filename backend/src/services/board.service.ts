import type { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma'
import { ApiError } from '../lib/ApiError'
import { emitToBoard } from '../realtime/emit'
import { SERVER_EVENTS } from '../realtime/events'
import type { BoardQuery, CreateBoardInput, UpdateBoardInput } from '../validators/board.validators'

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
} as const

const PUBLIC_BOARD_SELECT = {
  id: true,
  title: true,
  description: true,
  isArchived: true,
  updatedAt: true,
  owner: { select: { fullName: true } },
  labels: { select: { id: true, name: true, colorToken: true }, orderBy: { name: 'asc' } },
  columns: {
    select: {
      id: true,
      title: true,
      position: true,
      wipLimit: true,
      cards: {
        where: { isArchived: false },
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          position: true,
          labels: { select: { label: { select: { id: true, name: true, colorToken: true } } } },
          assignees: { select: { user: { select: { id: true, fullName: true } } } },
          _count: { select: { comments: true, attachments: true, checklistItems: true } },
        },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      },
    },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.BoardSelect

export async function getPublicBoardView(boardId: string) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: PUBLIC_BOARD_SELECT,
  })

  if (!board) {
    throw ApiError.notFound('Board not found')
  }

  return {
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      cards: column.cards.map((card) => ({
        ...card,
        labels: card.labels.map((cardLabel) => cardLabel.label),
        assignees: card.assignees.map((assignee) => assignee.user),
      })),
    })),
  }
}

export async function listBoardsForUser(userId: string) {
  return prisma.board.findMany({
    where: { members: { some: { userId } } },
    select: BOARD_SUMMARY_SELECT,
    orderBy: [{ isArchived: 'asc' }, { updatedAt: 'desc' }],
  })
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function endOfToday() {
  const date = new Date()
  date.setHours(23, 59, 59, 999)
  return date
}

function buildDueDateFilter(due: BoardQuery['due']): Prisma.CardWhereInput {
  switch (due) {
    case 'overdue':
      return { dueDate: { lt: startOfToday() } }
    case 'today':
      return { dueDate: { gte: startOfToday(), lte: endOfToday() } }
    case 'week': {
      const weekAhead = endOfToday()
      weekAhead.setDate(weekAhead.getDate() + 6)
      return { dueDate: { gte: startOfToday(), lte: weekAhead } }
    }
    case 'none':
      return { dueDate: null }
    default:
      return {}
  }
}

function buildCardFilter(query: BoardQuery): Prisma.CardWhereInput {
  const conditions: Prisma.CardWhereInput[] = [buildDueDateFilter(query.due)]

  if (query.includeArchived !== true) {
    conditions.push({ isArchived: false })
  }

  if (query.assigneeId) {
    conditions.push({ assignees: { some: { userId: query.assigneeId } } })
  }

  if (query.labelId) {
    conditions.push({ labels: { some: { labelId: query.labelId } } })
  }

  if (query.q) {
    conditions.push({
      OR: [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ],
    })
  }

  return { AND: conditions }
}

export async function getBoardDetail(boardId: string, query: BoardQuery = {}) {
  const cardFilter = buildCardFilter(query)

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: {
      ...BOARD_DETAIL_SELECT,
      columns: {
        select: {
          id: true,
          title: true,
          position: true,
          wipLimit: true,
          createdAt: true,
          cards: {
            where: cardFilter,
            select: {
              id: true,
              columnId: true,
              title: true,
              description: true,
              dueDate: true,
              position: true,
              isArchived: true,
              version: true,
              createdAt: true,
              updatedAt: true,
              labels: {
                select: { label: { select: { id: true, name: true, colorToken: true } } },
              },
              assignees: {
                select: { user: { select: { id: true, email: true, fullName: true } } },
                orderBy: { assignedAt: 'asc' },
              },
              _count: { select: { comments: true, attachments: true, checklistItems: true } },
            },
            orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
          },
          _count: { select: { cards: { where: { isArchived: false } } } },
        },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      },
    },
  })

  if (!board) {
    throw ApiError.notFound('Board not found')
  }

  return {
    ...board,
    columns: board.columns.map((column) => ({
      id: column.id,
      title: column.title,
      position: column.position,
      wipLimit: column.wipLimit,
      createdAt: column.createdAt,
      activeCardCount: column._count.cards,
      cards: column.cards.map((card) => ({
        ...card,
        labels: card.labels.map((cardLabel) => cardLabel.label),
        assignees: card.assignees.map((assignee) => assignee.user),
      })),
    })),
  }
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

export async function updateBoard(boardId: string, input: UpdateBoardInput, actorId: string) {
  const board = await prisma.board.update({
    where: { id: boardId },
    data: {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.description === undefined ? {} : { description: input.description }),
    },
    select: BOARD_SUMMARY_SELECT,
  })

  emitToBoard(boardId, SERVER_EVENTS.boardUpdated, { actorId, board })

  return board
}

export async function setBoardArchived(boardId: string, isArchived: boolean, actorId: string) {
  const board = await prisma.board.update({
    where: { id: boardId },
    data: { isArchived },
    select: BOARD_SUMMARY_SELECT,
  })

  emitToBoard(boardId, SERVER_EVENTS.boardArchived, { actorId, isArchived, board })

  return board
}

export async function deleteBoard(boardId: string, actorId: string) {
  await prisma.board.delete({ where: { id: boardId } })

  emitToBoard(boardId, SERVER_EVENTS.boardDeleted, { actorId })
}
