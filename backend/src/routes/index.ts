import { Router } from 'express'
import { env } from '../config/env'
import { assertDatabaseConnection } from '../config/prisma'
import { adminRouter } from './admin.routes'
import { authRouter } from './auth.routes'
import { boardRouter } from './board.routes'
import { columnRouter } from './column.routes'
import { publicRouter } from './public.routes'

export const apiRouter = Router()

apiRouter.get('/health', async (_request, response) => {
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

apiRouter.use('/auth', authRouter)
apiRouter.use('/boards', boardRouter)
apiRouter.use('/columns', columnRouter)
apiRouter.use('/public', publicRouter)
apiRouter.use('/admin', adminRouter)
