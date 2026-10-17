import { randomUUID } from 'node:crypto'
import type { BoardRole, LabelColor, SystemRole } from '@prisma/client'
import { prisma } from '../../src/config/prisma'
import { signAccessToken } from '../../src/lib/jwt'
import { hashPassword } from '../../src/lib/password'

export const TEST_PASSWORD = 'Password123!'

const POSITION_STEP = 1024

let cachedPasswordHash: string | null = null

async function passwordHashFor(password: string) {
  if (password !== TEST_PASSWORD) {
    return hashPassword(password)
  }

  cachedPasswordHash ??= await hashPassword(password)

  return cachedPasswordHash
}

export type TestUser = {
  id: string
  email: string
  fullName: string
  systemRole: SystemRole
  password: string
  token: string
}

export async function createUser(
  overrides: {
    email?: string
    fullName?: string
    password?: string
    systemRole?: SystemRole
  } = {},
): Promise<TestUser> {
  const password = overrides.password ?? TEST_PASSWORD
  const user = await prisma.user.create({
    data: {
      email: overrides.email ?? `user-${randomUUID()}@kanban.test`,
      fullName: overrides.fullName ?? 'Test User',
      passwordHash: await passwordHashFor(password),
      systemRole: overrides.systemRole ?? 'USER',
    },
  })

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    systemRole: user.systemRole,
    password,
    token: signAccessToken(user),
  }
}

export async function createBoard(
  ownerId: string,
  overrides: { title?: string; description?: string; isArchived?: boolean } = {},
) {
  return prisma.board.create({
    data: {
      title: overrides.title ?? 'Test Board',
      description: overrides.description ?? null,
      isArchived: overrides.isArchived ?? false,
      ownerId,
      members: { create: { userId: ownerId, role: 'OWNER' } },
    },
  })
}

export async function addBoardMember(boardId: string, userId: string, role: BoardRole) {
  return prisma.boardMember.create({ data: { boardId, userId, role } })
}

export async function createColumn(
  boardId: string,
  overrides: { title?: string; wipLimit?: number | null } = {},
) {
  const existingColumns = await prisma.column.count({ where: { boardId } })

  return prisma.column.create({
    data: {
      boardId,
      title: overrides.title ?? `Column ${existingColumns + 1}`,
      wipLimit: overrides.wipLimit ?? null,
      position: (existingColumns + 1) * POSITION_STEP,
    },
  })
}

export async function createCard(
  columnId: string,
  createdById: string,
  overrides: { title?: string; description?: string; dueDate?: Date | null } = {},
) {
  const existingCards = await prisma.card.count({ where: { columnId } })

  return prisma.card.create({
    data: {
      columnId,
      createdById,
      title: overrides.title ?? `Card ${existingCards + 1}`,
      description: overrides.description ?? null,
      dueDate: overrides.dueDate ?? null,
      position: (existingCards + 1) * POSITION_STEP,
    },
  })
}

export async function createCards(columnId: string, createdById: string, titles: string[]) {
  const cards = []

  for (const title of titles) {
    cards.push(await createCard(columnId, createdById, { title }))
  }

  return cards
}

export async function createLabel(
  boardId: string,
  overrides: { name?: string; colorToken?: LabelColor } = {},
) {
  return prisma.label.create({
    data: {
      boardId,
      name: overrides.name ?? `Label ${randomUUID().slice(0, 8)}`,
      colorToken: overrides.colorToken ?? 'BLACK',
    },
  })
}

export async function createBoardWithColumns(
  ownerId: string,
  columnTitles: string[],
  overrides: { title?: string } = {},
) {
  const board = await createBoard(ownerId, overrides)
  const columns = []

  for (const title of columnTitles) {
    columns.push(await createColumn(board.id, { title }))
  }

  return { board, columns }
}
