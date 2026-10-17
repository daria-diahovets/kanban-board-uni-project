const TEST_DATABASE_SUFFIX = '_test'
const SAFE_DATABASE_NAME = /^[A-Za-z0-9_]+$/

export function testDatabaseUrl() {
  const explicitUrl = process.env.TEST_DATABASE_URL

  if (explicitUrl) {
    return explicitUrl
  }

  const developmentUrl = process.env.DATABASE_URL

  if (!developmentUrl) {
    throw new Error('DATABASE_URL must be set before the test database url can be derived')
  }

  const url = new URL(developmentUrl)
  const name = url.pathname.replace(/^\//, '')

  if (!name) {
    throw new Error('DATABASE_URL must include a database name')
  }

  url.pathname = `/${name.endsWith(TEST_DATABASE_SUFFIX) ? name : name + TEST_DATABASE_SUFFIX}`

  return url.toString()
}

export function databaseNameOf(databaseUrl: string) {
  const name = new URL(databaseUrl).pathname.replace(/^\//, '')

  if (!SAFE_DATABASE_NAME.test(name)) {
    throw new Error(`Refusing to use "${name}" as a database name`)
  }

  return name
}

export function maintenanceUrlOf(databaseUrl: string) {
  const url = new URL(databaseUrl)
  url.pathname = '/postgres'
  url.search = ''

  return url.toString()
}
