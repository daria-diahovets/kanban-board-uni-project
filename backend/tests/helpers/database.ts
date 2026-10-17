import { prisma } from '../../src/config/prisma'

export async function resetDatabase() {
  await prisma.board.deleteMany()
  await prisma.user.deleteMany()
}

export async function disconnectDatabase() {
  await prisma.$disconnect()
}

export async function currentDatabaseName() {
  const rows = await prisma.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`

  return rows[0]?.name ?? null
}
