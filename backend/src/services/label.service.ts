import { prisma } from '../config/prisma'
import { ApiError } from '../lib/ApiError'
import type { CreateLabelInput, UpdateLabelInput } from '../validators/label.validators'

const LABEL_SELECT = {
  id: true,
  boardId: true,
  name: true,
  colorToken: true,
  createdAt: true,
  _count: { select: { cards: true } },
} as const

export async function listBoardLabels(boardId: string) {
  return prisma.label.findMany({
    where: { boardId },
    select: LABEL_SELECT,
    orderBy: { name: 'asc' },
  })
}

export async function createLabel(boardId: string, input: CreateLabelInput) {
  const existing = await prisma.label.findUnique({
    where: { boardId_name: { boardId, name: input.name } },
    select: { id: true },
  })

  if (existing) {
    throw ApiError.conflict('A label with this name already exists on the board')
  }

  return prisma.label.create({
    data: { boardId, name: input.name, colorToken: input.colorToken },
    select: LABEL_SELECT,
  })
}

export async function updateLabel(labelId: string, input: UpdateLabelInput) {
  const label = await prisma.label.findUnique({
    where: { id: labelId },
    select: { boardId: true },
  })

  if (!label) {
    throw ApiError.notFound('Label not found')
  }

  if (input.name !== undefined) {
    const duplicate = await prisma.label.findUnique({
      where: { boardId_name: { boardId: label.boardId, name: input.name } },
      select: { id: true },
    })

    if (duplicate && duplicate.id !== labelId) {
      throw ApiError.conflict('A label with this name already exists on the board')
    }
  }

  return prisma.label.update({
    where: { id: labelId },
    data: {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.colorToken === undefined ? {} : { colorToken: input.colorToken }),
    },
    select: LABEL_SELECT,
  })
}

export async function deleteLabel(labelId: string) {
  await prisma.label.delete({ where: { id: labelId } })
}
