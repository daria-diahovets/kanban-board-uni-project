import request from 'supertest'
import { createApp } from '../../src/app'
import { SESSION_COOKIE_NAME } from '../../src/lib/sessionCookie'

export const app = createApp()

export const api = () => request(app)

export function sessionCookie(token: string) {
  return `${SESSION_COOKIE_NAME}=${token}`
}

export function readSessionCookie(headers: Record<string, unknown>) {
  const setCookie = headers['set-cookie']
  const entries = Array.isArray(setCookie) ? (setCookie as string[]) : []
  const session = entries.find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`))

  if (!session) {
    return undefined
  }

  const value = session.slice(SESSION_COOKIE_NAME.length + 1).split(';')[0]

  return value && value.length > 0 ? value : undefined
}

export async function loginAs(email: string, password: string) {
  const response = await api().post('/api/auth/login').send({ email, password })

  return { status: response.status, token: readSessionCookie(response.headers) }
}
