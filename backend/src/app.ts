import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { env } from './config/env'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { rejectCrossSite } from './middleware/rejectCrossSite'
import { apiRouter } from './routes'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
  app.use(cookieParser())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))

  app.use('/api', rejectCrossSite, apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
