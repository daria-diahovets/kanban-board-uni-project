import type { RequestHandler } from 'express'
import { ApiError } from '../lib/ApiError'
import { verifyAccessToken } from '../lib/jwt'
import { SESSION_COOKIE_NAME } from '../lib/sessionCookie'

export const authenticate: RequestHandler = (request, _response, next) => {
  const token = request.cookies?.[SESSION_COOKIE_NAME]

  if (typeof token !== 'string' || token.length === 0) {
    next(ApiError.unauthorized('A session cookie is required'))
    return
  }

  const payload = verifyAccessToken(token)

  request.user = {
    id: payload.sub,
    email: payload.email,
    systemRole: payload.systemRole,
  }

  next()
}

export function requireUser(request: Express.Request) {
  if (!request.user) {
    throw ApiError.unauthorized()
  }

  return request.user
}
