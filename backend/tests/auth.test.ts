import { describe, expect, it } from 'vitest'
import { prisma } from '../src/config/prisma'
import { api, bearer, loginAs } from './helpers/api'
import { currentDatabaseName } from './helpers/database'
import { TEST_PASSWORD, createUser } from './helpers/factories'

describe('test harness', () => {
  it('runs against a dedicated test database', async () => {
    const name = await currentDatabaseName()

    expect(name).toMatch(/_test$/)
  })

  it('starts every test with an empty database', async () => {
    await createUser()

    expect(await prisma.user.count()).toBe(1)
  })

  it('serves the health route', async () => {
    const response = await api().get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ status: 'ok', environment: 'test', database: 'up' })
  })

  it('answers an unknown route with 404', async () => {
    const response = await api().get('/api/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/auth/register', () => {
  it('creates an account and returns a token', async () => {
    const response = await api()
      .post('/api/auth/register')
      .send({ email: 'new.user@kanban.test', password: TEST_PASSWORD, fullName: 'New User' })

    expect(response.status).toBe(201)
    expect(response.body.user).toMatchObject({
      email: 'new.user@kanban.test',
      fullName: 'New User',
      systemRole: 'USER',
    })
    expect(typeof response.body.token).toBe('string')
    expect(response.body.user.passwordHash).toBeUndefined()
  })

  it('rejects a duplicate email with 409', async () => {
    const user = await createUser({ email: 'taken@kanban.test' })
    const response = await api()
      .post('/api/auth/register')
      .send({ email: user.email, password: TEST_PASSWORD, fullName: 'Someone Else' })

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('CONFLICT')
  })

  it('rejects an invalid payload with 422', async () => {
    const response = await api()
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short', fullName: 'A' })

    expect(response.status).toBe(422)
    expect(response.body.error.code).toBe('VALIDATION_FAILED')
  })
})

describe('POST /api/auth/login', () => {
  it('accepts correct credentials', async () => {
    const user = await createUser()
    const result = await loginAs(user.email, user.password)

    expect(result.status).toBe(200)
    expect(typeof result.token).toBe('string')
  })

  it('rejects a wrong password with 401', async () => {
    const user = await createUser()
    const result = await loginAs(user.email, 'WrongPassword123!')

    expect(result.status).toBe(401)
    expect(result.token).toBeUndefined()
  })

  it('rejects an unknown email with 401', async () => {
    const result = await loginAs('nobody@kanban.test', TEST_PASSWORD)

    expect(result.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns the authenticated user for a factory token', async () => {
    const user = await createUser({ fullName: 'Token Owner' })
    const response = await api().get('/api/auth/me').set('authorization', bearer(user.token))

    expect(response.status).toBe(200)
    expect(response.body.user).toMatchObject({ id: user.id, fullName: 'Token Owner' })
  })

  it('rejects a missing token with 401', async () => {
    const response = await api().get('/api/auth/me')

    expect(response.status).toBe(401)
  })

  it('rejects a malformed token with 401', async () => {
    const response = await api().get('/api/auth/me').set('authorization', bearer('not.a.token'))

    expect(response.status).toBe(401)
  })
})
