import type { RequestHandler, Response } from 'express'
import { accessTokenExpiresAt } from '../lib/jwt'
import {
  SESSION_COOKIE_NAME,
  clearedSessionCookieOptions,
  sessionCookieOptions,
} from '../lib/sessionCookie'
import { requireUser } from '../middleware/authenticate'
import { getUserById, loginUser, registerUser } from '../services/auth.service'
import type { LoginInput, RegisterInput } from '../validators/auth.validators'

function startSession(response: Response, token: string) {
  response.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(accessTokenExpiresAt(token)))
}

export const register: RequestHandler = async (request, response) => {
  const { user, token } = await registerUser(request.validated.body as RegisterInput)

  startSession(response, token)
  response.status(201).json({ user })
}

export const login: RequestHandler = async (request, response) => {
  const { user, token } = await loginUser(request.validated.body as LoginInput)

  startSession(response, token)
  response.json({ user })
}

export const logout: RequestHandler = (_request, response) => {
  response.clearCookie(SESSION_COOKIE_NAME, clearedSessionCookieOptions())
  response.status(204).send()
}

export const me: RequestHandler = async (request, response) => {
  const user = await getUserById(requireUser(request).id)
  response.json({ user })
}
