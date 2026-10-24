import { describe, expect, it } from 'vitest'
import { prisma } from '../src/config/prisma'
import { api, loginAs, readSessionCookie, sessionCookie } from './helpers/api'
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
  it('creates an account and starts a session cookie', async () => {
    const response = await api()
      .post('/api/auth/register')
      .send({ email: 'new.user@kanban.test', password: TEST_PASSWORD, fullName: 'New User' })

    expect(response.status).toBe(201)
    expect(response.body.user).toMatchObject({
      email: 'new.user@kanban.test',
      fullName: 'New User',
      systemRole: 'USER',
    })
    expect(response.body.user.passwordHash).toBeUndefined()
    expect(response.body.token).toBeUndefined()
    expect(typeof readSessionCookie(response.headers)).toBe('string')
  })

  it('marks the session cookie http only, same site and scoped to the root path', async () => {
    const response = await api()
      .post('/api/auth/register')
      .send({ email: 'cookie.user@kanban.test', password: TEST_PASSWORD, fullName: 'Cookie User' })

    const setCookie = (response.headers['set-cookie'] as unknown as string[]).find((entry) =>
      entry.startsWith('kanban_token='),
    )

    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=Lax')
    expect(setCookie).toContain('Path=/')
    expect(setCookie).toContain('Expires=')
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
    const response = await api().get('/api/auth/me').set('cookie', sessionCookie(user.token))

    expect(response.status).toBe(200)
    expect(response.body.user).toMatchObject({ id: user.id, fullName: 'Token Owner' })
  })

  it('rejects a missing token with 401', async () => {
    const response = await api().get('/api/auth/me')

    expect(response.status).toBe(401)
  })

  it('rejects a malformed token with 401', async () => {
    const response = await api().get('/api/auth/me').set('cookie', sessionCookie('not.a.token'))

    expect(response.status).toBe(401)
  })

  it('refuses a token offered through an authorization header', async () => {
    const user = await createUser()
    const response = await api().get('/api/auth/me').set('authorization', `Bearer ${user.token}`)

    expect(response.status).toBe(401)
  })
})

describe('POST /api/auth/logout', () => {
  it('clears the session cookie and ends access', async () => {
    const user = await createUser()
    const response = await api().post('/api/auth/logout').set('cookie', sessionCookie(user.token))

    expect(response.status).toBe(204)
    expect(readSessionCookie(response.headers)).toBeUndefined()

    const afterLogout = await api().get('/api/auth/me')

    expect(afterLogout.status).toBe(401)
  })

  it('answers the same way without a session', async () => {
    const response = await api().post('/api/auth/logout')

    expect(response.status).toBe(204)
  })
})

describe('cross-site protection', () => {
  it('refuses a write request announced as cross-site', async () => {
    const user = await createUser()
    const response = await api()
      .post('/api/boards')
      .set('cookie', sessionCookie(user.token))
      .set('sec-fetch-site', 'cross-site')
      .send({ title: 'Forged board' })

    expect(response.status).toBe(403)
  })

  it('allows the same request from the application itself', async () => {
    const user = await createUser()
    const response = await api()
      .post('/api/boards')
      .set('cookie', sessionCookie(user.token))
      .set('sec-fetch-site', 'same-origin')
      .send({ title: 'Real board' })

    expect(response.status).toBe(201)
  })
})
