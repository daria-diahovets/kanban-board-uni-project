import { prisma } from '../config/prisma'
import { ApiError } from '../lib/ApiError'
import { emitToBoard } from '../realtime/emit'
import { SERVER_EVENTS } from '../realtime/events'
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

async function findComment(commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, cardId: true },
  })

  if (!comment) {
    throw ApiError.notFound('Comment not found')
  }

  return comment
}

export async function listCardComments(cardId: string) {
  return prisma.comment.findMany({
    where: { cardId },
    select: COMMENT_SELECT,
    orderBy: { createdAt: 'asc' },
  })
}

export async function createComment(
  boardId: string,
  cardId: string,
  authorId: string,
  input: CreateCommentInput,
) {
  const comment = await prisma.comment.create({
    data: { cardId, authorId, body: input.body },
    select: COMMENT_SELECT,
  })

  emitToBoard(boardId, SERVER_EVENTS.commentCreated, { actorId: authorId, cardId, comment })

  return comment
}

export async function updateComment(
  boardId: string,
  commentId: string,
  actor: CommentActor,
  input: UpdateCommentInput,
) {
  const existing = await findComment(commentId)

  if (existing.authorId !== actor.id) {
    throw ApiError.forbidden('Only the author can edit a comment')
  }

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { body: input.body },
    select: COMMENT_SELECT,
  })

  emitToBoard(boardId, SERVER_EVENTS.commentUpdated, {
    actorId: actor.id,
    cardId: existing.cardId,
    comment,
  })

  return comment
}

export async function deleteComment(boardId: string, commentId: string, actor: CommentActor) {
  const existing = await findComment(commentId)

  if (existing.authorId !== actor.id && !actor.isOwner) {
    throw ApiError.forbidden('Only the author or the board owner can delete a comment')
  }

  await prisma.comment.delete({ where: { id: commentId } })

  emitToBoard(boardId, SERVER_EVENTS.commentDeleted, {
    actorId: actor.id,
    cardId: existing.cardId,
    commentId,
  })
}
