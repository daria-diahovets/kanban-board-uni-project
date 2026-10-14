import type { User } from '@prisma/client'
import { prisma } from '../config/prisma'
import { ApiError } from '../lib/ApiError'
import { signAccessToken } from '../lib/jwt'
import { burnPasswordComparison, hashPassword, verifyPassword } from '../lib/password'
import type { LoginInput, RegisterInput } from '../validators/auth.validators'

const INVALID_CREDENTIALS_MESSAGE = 'Email or password is incorrect'

export type PublicUser = {
  id: string
  email: string
  fullName: string
  systemRole: User['systemRole']
  createdAt: Date
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    systemRole: user.systemRole,
    createdAt: user.createdAt,
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function registerUser(input: RegisterInput) {
  const email = normalizeEmail(input.email)
  const existingUser = await prisma.user.findUnique({ where: { email } })

  if (existingUser) {
    throw ApiError.conflict('Email is already registered')
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(input.password),
      fullName: input.fullName,
    },
  })

  return { user: toPublicUser(user), token: signAccessToken(user) }
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(input.email) } })

  if (!user) {
    await burnPasswordComparison(input.password)
    throw ApiError.unauthorized(INVALID_CREDENTIALS_MESSAGE)
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash)

  if (!passwordMatches) {
    throw ApiError.unauthorized(INVALID_CREDENTIALS_MESSAGE)
  }

  return { user: toPublicUser(user), token: signAccessToken(user) }
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    throw ApiError.unauthorized('Account no longer exists')
  }

  return toPublicUser(user)
}
