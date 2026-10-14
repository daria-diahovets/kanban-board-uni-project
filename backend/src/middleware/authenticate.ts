import type { RequestHandler } from 'express'
import { ApiError } from '../lib/ApiError'
import { verifyAccessToken } from '../lib/jwt'

const BEARER_PREFIX = 'Bearer '

export const authenticate: RequestHandler = (request, _response, next) => {
  const header = request.headers.authorization

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    next(ApiError.unauthorized('Authorization header with a bearer token is required'))
    return
  }

  const payload = verifyAccessToken(header.slice(BEARER_PREFIX.length).trim())

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
