import { createServer } from 'node:http'
import { createApp } from './app'
import { env } from './config/env'
import { prisma } from './config/prisma'
import { closeRealtime, initializeRealtime } from './realtime/io'

const app = createApp()
const server = createServer(app)

initializeRealtime(server)

server.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`)
})

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down`)

  await closeRealtime()

  server.close(() => {
    void prisma.$disconnect().then(() => process.exit(0))
  })

  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
