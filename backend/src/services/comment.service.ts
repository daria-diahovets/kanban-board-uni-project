import { prisma } from '../config/prisma'
import { ApiError } from '../lib/ApiError'
import type { CreateCommentInput, UpdateCommentInput } from '../validators/comment.validators'

const COMMENT_SELECT = {
  id: true,
  cardId: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, email: true, fullName: true } },
} as const

type CommentActor = {
  id: string
  isOwner: boolean
}

async function findCommentAuthor(commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true },
  })

  if (!comment) {
    throw ApiError.notFound('Comment not found')
  }

  return comment.authorId
}

export async function listCardComments(cardId: string) {
  return prisma.comment.findMany({
    where: { cardId },
    select: COMMENT_SELECT,
    orderBy: { createdAt: 'asc' },
  })
}

export async function createComment(cardId: string, authorId: string, input: CreateCommentInput) {
  return prisma.comment.create({
    data: { cardId, authorId, body: input.body },
    select: COMMENT_SELECT,
  })
}

export async function updateComment(
  commentId: string,
  actor: CommentActor,
  input: UpdateCommentInput,
) {
  const authorId = await findCommentAuthor(commentId)

  if (authorId !== actor.id) {
    throw ApiError.forbidden('Only the author can edit a comment')
  }

  return prisma.comment.update({
    where: { id: commentId },
    data: { body: input.body },
    select: COMMENT_SELECT,
  })
}

export async function deleteComment(commentId: string, actor: CommentActor) {
  const authorId = await findCommentAuthor(commentId)

  if (authorId !== actor.id && !actor.isOwner) {
    throw ApiError.forbidden('Only the author or the board owner can delete a comment')
  }

  await prisma.comment.delete({ where: { id: commentId } })
}
