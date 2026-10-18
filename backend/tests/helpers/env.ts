import { tmpdir } from 'node:os'
import { join } from 'node:path'
import 'dotenv/config'
import { testDatabaseUrl } from './testDatabase'

export const temporaryUploadDirectory = join(tmpdir(), `kanban-test-uploads-${process.pid}`)

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = testDatabaseUrl()
process.env.UPLOAD_DIR = temporaryUploadDirectory
process.env.MAX_UPLOAD_BYTES = '65536'
process.env.JWT_SECRET ??= 'test_jwt_secret_value_32_characters'
process.env.CORS_ORIGIN ??= 'http://localhost:5173'
