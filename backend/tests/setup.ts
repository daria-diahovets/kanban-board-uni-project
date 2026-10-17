import './helpers/env'
import { afterAll, beforeEach } from 'vitest'
import { disconnectDatabase, resetDatabase } from './helpers/database'

beforeEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  await disconnectDatabase()
})
