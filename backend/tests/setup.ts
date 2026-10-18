import { temporaryUploadDirectory } from './helpers/env'
import { rm } from 'node:fs/promises'
import { afterAll, beforeEach } from 'vitest'
import { disconnectDatabase, resetDatabase } from './helpers/database'

beforeEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  await disconnectDatabase()
  await rm(temporaryUploadDirectory, { recursive: true, force: true })
})
