import cors from 'cors'
import express from 'express'
import { env } from './config/env'
import { assertDatabaseConnection } from './config/prisma'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))

  app.get('/api/health', async (_request, response) => {
    let database = 'up'

    try {
      await assertDatabaseConnection()
    } catch {
      database = 'down'
    }

    response.status(database === 'up' ? 200 : 503).json({
      status: database === 'up' ? 'ok' : 'degraded',
      environment: env.NODE_ENV,
      uptimeSeconds: Math.round(process.uptime()),
      database,
    })
  })

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
