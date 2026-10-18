import type { RequestHandler } from 'express'
import { requireUser } from '../middleware/authenticate'
import { requireBoardAccess } from '../middleware/authorizeBoard'
import {
  createComment,
  deleteComment,
  listCardComments,
  updateComment,
} from '../services/comment.service'
import type {
  CardCommentsParams,
  CommentParams,
  CreateCommentInput,
  UpdateCommentInput,
} from '../validators/comment.validators'

function commentActor(request: Parameters<RequestHandler>[0]) {
  return { id: requireUser(request).id, isOwner: requireBoardAccess(request).isOwner }
}

export const listComments: RequestHandler = async (request, response) => {
  const { cardId } = request.validated.params as CardCommentsParams
  const comments = await listCardComments(cardId)
  response.json({ comments })
}

export const postComment: RequestHandler = async (request, response) => {
  const { cardId } = request.validated.params as CardCommentsParams
  const comment = await createComment(
    requireBoardAccess(request).boardId,
    cardId,
    requireUser(request).id,
    request.validated.body as CreateCommentInput,
  )
  response.status(201).json({ comment })
}

export const patchComment: RequestHandler = async (request, response) => {
  const { commentId } = request.validated.params as CommentParams
  const comment = await updateComment(
    requireBoardAccess(request).boardId,
    commentId,
    commentActor(request),
    request.validated.body as UpdateCommentInput,
  )
  response.json({ comment })
}

export const removeComment: RequestHandler = async (request, response) => {
  const { commentId } = request.validated.params as CommentParams
  await deleteComment(requireBoardAccess(request).boardId, commentId, commentActor(request))
  response.status(204).send()
}
