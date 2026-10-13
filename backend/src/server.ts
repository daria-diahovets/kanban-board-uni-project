import { createApp } from './app'
import { env } from './config/env'
import { prisma } from './config/prisma'

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`)
})

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down`)

  server.close(() => {
    void prisma.$disconnect().then(() => process.exit(0))
  })

  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
