import 'dotenv/config'
import { testDatabaseUrl } from './testDatabase'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = testDatabaseUrl()
process.env.JWT_SECRET ??= 'test_jwt_secret_value_32_characters'
process.env.CORS_ORIGIN ??= 'http://localhost:5173'
