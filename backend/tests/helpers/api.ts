import request from 'supertest'
import { createApp } from '../../src/app'

export const app = createApp()

export const api = () => request(app)

export function bearer(token: string) {
  return `Bearer ${token}`
}

export async function loginAs(email: string, password: string) {
  const response = await api().post('/api/auth/login').send({ email, password })

  return { status: response.status, token: response.body?.token as string | undefined }
}
