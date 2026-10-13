import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'
import { z } from 'zod'
import { ApiError } from '../lib/ApiError'

type ValidationSource = 'body' | 'params' | 'query'

type ValidationSchemas = Partial<Record<ValidationSource, ZodType>>

type ValidatedPayload = Partial<Record<ValidationSource, unknown>>

const VALIDATION_SOURCES: ValidationSource[] = ['body', 'params', 'query']

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (request, _response, next) => {
    const validated: ValidatedPayload = {}
    const issues: ValidatedPayload = {}

    for (const source of VALIDATION_SOURCES) {
      const schema = schemas[source]

      if (!schema) {
        continue
      }

      const result = schema.safeParse(request[source])

      if (result.success) {
        validated[source] = result.data
      } else {
        issues[source] = z.treeifyError(result.error)
      }
    }

    if (Object.keys(issues).length > 0) {
      next(ApiError.validationFailed(issues))
      return
    }

    request.validated = validated
    next()
  }
}
