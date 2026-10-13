import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { env, isProduction } from './env'

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  log: isProduction ? ['error'] : ['warn', 'error'],
})

export async function assertDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`
}
