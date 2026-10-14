import type { RequestHandler } from 'express'
import { requireUser } from '../middleware/authenticate'
import { getUserById, loginUser, registerUser } from '../services/auth.service'
import type { LoginInput, RegisterInput } from '../validators/auth.validators'

export const register: RequestHandler = async (request, response) => {
  const result = await registerUser(request.validated.body as RegisterInput)
  response.status(201).json(result)
}

export const login: RequestHandler = async (request, response) => {
  const result = await loginUser(request.validated.body as LoginInput)
  response.json(result)
}

export const me: RequestHandler = async (request, response) => {
  const user = await getUserById(requireUser(request).id)
  response.json({ user })
}
