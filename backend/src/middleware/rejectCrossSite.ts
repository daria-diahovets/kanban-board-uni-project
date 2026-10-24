import type { RequestHandler } from 'express'
import { ApiError } from '../lib/ApiError'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export const rejectCrossSite: RequestHandler = (request, _response, next) => {
  if (SAFE_METHODS.has(request.method)) {
    next()
    return
  }

  if (request.headers['sec-fetch-site'] === 'cross-site') {
    next(ApiError.forbidden('Cross-site write requests are not allowed'))
    return
  }

  next()
}
