import type { BoardRole } from '@prisma/client'
import type { RequestHandler } from 'express'
import { ApiError } from '../lib/ApiError'
import type { BoardEventContext } from '../realtime/emit'
import { BOARD_ROLE_RANK, getBoardAccess, resolveBoardId } from '../services/boardAccess.service'
import { requireUser } from './authenticate'

type AuthorizeBoardOptions = {
  allowArchived?: boolean
}

export function authorizeBoard(
  minimumRole: BoardRole,
  options: AuthorizeBoardOptions = {},
): RequestHandler {
  return async (request, _response, next) => {
    const user = requireUser(request)
    const boardId = await resolveBoardId(request.params)
    const access = await getBoardAccess(boardId, user)

    if (BOARD_ROLE_RANK[access.role] < BOARD_ROLE_RANK[minimumRole]) {
      next(ApiError.forbidden(`This action requires the ${minimumRole} role on the board`))
      return
    }

    const isWriteAction = BOARD_ROLE_RANK[minimumRole] > BOARD_ROLE_RANK.VIEWER

    if (access.isArchived && isWriteAction && !options.allowArchived) {
      next(ApiError.forbidden('Board is archived and read-only'))
      return
    }

    request.boardAccess = access
    next()
  }
}

export function requireBoardAccess(request: Express.Request) {
  if (!request.boardAccess) {
    throw ApiError.forbidden()
  }

  return request.boardAccess
}

export function boardEventContext(request: Express.Request): BoardEventContext {
  return {
    boardId: requireBoardAccess(request).boardId,
    actorId: requireUser(request).id,
  }
}
