import type { RequestHandler } from 'express'
import { ApiError } from '../lib/ApiError'
import { requireUser } from './authenticate'

export const requireAdmin: RequestHandler = (request, _response, next) => {
  const user = requireUser(request)

  if (user.systemRole !== 'ADMIN') {
    next(ApiError.forbidden('This action requires an administrator account'))
    return
  }

  next()
}
