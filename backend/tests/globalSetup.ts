import './helpers/env'
import { execFileSync } from 'node:child_process'
import { Client } from 'pg'
import { databaseNameOf, maintenanceUrlOf, testDatabaseUrl } from './helpers/testDatabase'

async function createDatabaseIfMissing(databaseUrl: string) {
  const name = databaseNameOf(databaseUrl)
  const client = new Client({ connectionString: maintenanceUrlOf(databaseUrl) })

  await client.connect()

  try {
    const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name])

    if (existing.rowCount === 0) {
      await client.query(`CREATE DATABASE "${name}"`)
    }
  } finally {
    await client.end()
  }
}

export default async function globalSetup() {
  const databaseUrl = testDatabaseUrl()

  await createDatabaseIfMissing(databaseUrl)

  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  })
}
