import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { env } from '../config/env'
import { ApiError } from './ApiError'

const accessTokenPayloadSchema = z.object({
  sub: z.uuid(),
  email: z.email(),
  systemRole: z.enum(['USER', 'ADMIN']),
})

export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>

type TokenSubject = {
  id: string
  email: string
  systemRole: AccessTokenPayload['systemRole']
}

export function signAccessToken(user: TokenSubject) {
  return jwt.sign(
    { sub: user.id, email: user.email, systemRole: user.systemRole },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    },
  )
}

export function accessTokenExpiresAt(token: string) {
  const decoded = jwt.decode(token)

  if (decoded === null || typeof decoded === 'string' || typeof decoded.exp !== 'number') {
    throw ApiError.unauthorized('Access token has no expiry')
  }

  return new Date(decoded.exp * 1000)
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  let decoded: unknown

  try {
    decoded = jwt.verify(token, env.JWT_SECRET)
  } catch {
    throw ApiError.unauthorized('Access token is invalid or expired')
  }

  const payload = accessTokenPayloadSchema.safeParse(decoded)

  if (!payload.success) {
    throw ApiError.unauthorized('Access token payload is malformed')
  }

  return payload.data
}
