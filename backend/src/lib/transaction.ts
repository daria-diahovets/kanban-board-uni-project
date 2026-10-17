import { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma'
import { ApiError } from './ApiError'

export type TransactionClient = Prisma.TransactionClient

const MAX_SERIALIZATION_ATTEMPTS = 5
const RETRY_BASE_DELAY_MS = 20

const RETRYABLE_SQL_STATES = new Set(['40001', '40P01'])

function rawQuerySqlState(error: Prisma.PrismaClientKnownRequestError) {
  const adapterError = error.meta?.driverAdapterError

  if (typeof adapterError !== 'object' || adapterError === null) {
    return null
  }

  const cause = (adapterError as { cause?: unknown }).cause

  if (typeof cause !== 'object' || cause === null) {
    return null
  }

  const originalCode = (cause as { originalCode?: unknown }).originalCode

  return typeof originalCode === 'string' ? originalCode : null
}

function isSerializationFailure(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false
  }

  if (error.code === 'P2034') {
    return true
  }

  if (error.code !== 'P2010') {
    return false
  }

  const sqlState = rawQuerySqlState(error)

  return sqlState !== null && RETRYABLE_SQL_STATES.has(sqlState)
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function runSerializable<T>(
  operation: (transaction: TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_SERIALIZATION_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    } catch (error) {
      if (!isSerializationFailure(error) || attempt === MAX_SERIALIZATION_ATTEMPTS) {
        if (isSerializationFailure(error)) {
          throw ApiError.conflict('The board changed while this move was being applied')
        }

        throw error
      }

      await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1) * (1 + Math.random()))
    }
  }

  throw ApiError.conflict('The board changed while this move was being applied')
}
