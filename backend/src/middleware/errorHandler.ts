import { Prisma } from '@prisma/client'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError, z } from 'zod'
import { isProduction } from '../config/env'
import { ApiError } from '../lib/ApiError'

type BodyParserError = Error & { type?: string; status?: number }

const PRISMA_ERROR_MAP: Record<string, () => ApiError> = {
  P2002: () => ApiError.conflict('A record with these unique values already exists'),
  P2003: () => ApiError.badRequest('Referenced record does not exist'),
  P2007: () => ApiError.badRequest('Request contains a value the database rejected'),
  P2023: () => ApiError.badRequest('Identifier is malformed'),
  P2025: () => ApiError.notFound('Record not found'),
  P2034: () => ApiError.conflict('The operation conflicted with a concurrent change'),
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (error instanceof ZodError) {
    return ApiError.validationFailed(z.treeifyError(error))
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = PRISMA_ERROR_MAP[error.code]

    if (mapped) {
      return mapped()
    }
  }

  if (error instanceof Error) {
    const parserError = error as BodyParserError

    if (parserError.type === 'entity.too.large') {
      return ApiError.payloadTooLarge()
    }

    if (parserError.type === 'entity.parse.failed') {
      return ApiError.badRequest('Request body is not valid JSON')
    }
  }

  return ApiError.internal()
}

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(ApiError.notFound(`Route ${request.method} ${request.originalUrl} does not exist`))
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error)
    return
  }

  const apiError = toApiError(error)

  if (apiError.status >= 500) {
    console.error(error)
  }

  response.status(apiError.status).json({
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details === undefined ? {} : { details: apiError.details }),
      ...(isProduction || !(error instanceof Error) || apiError.status < 500
        ? {}
        : { stack: error.stack }),
    },
  })
}
