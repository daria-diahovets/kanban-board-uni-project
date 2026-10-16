import { prisma } from '../config/prisma'
import { ApiError } from '../lib/ApiError'
import type {
  CreateCardInput,
  SetAssigneesInput,
  UpdateCardInput,
} from '../validators/card.validators'
import { POSITION_STEP } from './column.service'

const CARD_SELECT = {
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
  createdBy: { select: { id: true, fullName: true } },
  assignees: {
    select: { user: { select: { id: true, email: true, fullName: true } } },
    orderBy: { assignedAt: 'asc' },
  },
  labels: { select: { label: { select: { id: true, name: true, colorToken: true } } } },
  _count: { select: { comments: true, attachments: true, checklistItems: true } },
} as const

type CardWithRelations = {
  assignees: { user: { id: string; email: string; fullName: string } }[]
  labels: { label: { id: string; name: string; colorToken: string } }[]
}

function flattenCard<T extends CardWithRelations>(card: T) {
  return {
    ...card,
    assignees: card.assignees.map((assignee) => assignee.user),
    labels: card.labels.map((cardLabel) => cardLabel.label),
  }
}

async function assertAssigneesAreBoardMembers(boardId: string, userIds: string[]) {
  if (userIds.length === 0) {
    return
  }

  const memberCount = await prisma.boardMember.count({
    where: { boardId, userId: { in: userIds } },
  })

  if (memberCount !== userIds.length) {
    throw ApiError.badRequest('Every assignee must be a member of this board')
  }
}

async function assertWipLimitAllowsOneMore(columnId: string) {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { wipLimit: true, title: true },
  })

  if (!column) {
    throw ApiError.notFound('Column not found')
  }

  if (column.wipLimit === null) {
    return
  }

  const activeCards = await prisma.card.count({ where: { columnId, isArchived: false } })

  if (activeCards >= column.wipLimit) {
    throw ApiError.conflict(
      `Column "${column.title}" has reached its limit of ${column.wipLimit} cards`,
    )
  }
}

export async function getCardDetail(cardId: string) {
  const card = await prisma.card.findUnique({ where: { id: cardId }, select: CARD_SELECT })

  if (!card) {
    throw ApiError.notFound('Card not found')
  }

  return flattenCard(card)
}

export async function createCard(
  boardId: string,
  columnId: string,
  createdById: string,
  input: CreateCardInput,
) {
  await assertWipLimitAllowsOneMore(columnId)

  const assigneeIds = [...new Set(input.assigneeIds ?? [])]
  await assertAssigneesAreBoardMembers(boardId, assigneeIds)

  const lastCard = await prisma.card.findFirst({
    where: { columnId },
    orderBy: { position: 'desc' },
    select: { position: true },
  })

  const card = await prisma.card.create({
    data: {
      columnId,
      createdById,
      title: input.title,
      description: input.description ?? null,
      dueDate: input.dueDate ?? null,
      position: lastCard ? lastCard.position.plus(POSITION_STEP) : POSITION_STEP,
      assignees: { create: assigneeIds.map((userId) => ({ userId })) },
    },
    select: CARD_SELECT,
  })

  return flattenCard(card)
}

export async function updateCard(cardId: string, input: UpdateCardInput) {
  if (input.version !== undefined) {
    const current = await prisma.card.findUnique({
      where: { id: cardId },
      select: { version: true },
    })

    if (!current) {
      throw ApiError.notFound('Card not found')
    }

    if (current.version !== input.version) {
      throw ApiError.conflict('This card was changed by someone else, reload and try again')
    }
  }

  const card = await prisma.card.update({
    where: { id: cardId },
    data: {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.dueDate === undefined ? {} : { dueDate: input.dueDate }),
      ...(input.isArchived === undefined ? {} : { isArchived: input.isArchived }),
      version: { increment: 1 },
    },
    select: CARD_SELECT,
  })

  return flattenCard(card)
}

export async function setCardAssignees(boardId: string, cardId: string, input: SetAssigneesInput) {
  const userIds = [...new Set(input.userIds)]
  await assertAssigneesAreBoardMembers(boardId, userIds)

  const card = await prisma.$transaction(async (transaction) => {
    await transaction.cardAssignee.deleteMany({ where: { cardId } })

    if (userIds.length > 0) {
      await transaction.cardAssignee.createMany({
        data: userIds.map((userId) => ({ cardId, userId })),
      })
    }

    return transaction.card.update({
      where: { id: cardId },
      data: { version: { increment: 1 } },
      select: CARD_SELECT,
    })
  })

  return flattenCard(card)
}

export async function deleteCard(cardId: string) {
  await prisma.card.delete({ where: { id: cardId } })
}
