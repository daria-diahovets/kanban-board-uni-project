import type { CookieOptions } from 'express'
import { env } from '../config/env'

export const SESSION_COOKIE_NAME = 'kanban_token'

function baseOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
  }
}

export function sessionCookieOptions(expiresAt: Date): CookieOptions {
  return { ...baseOptions(), expires: expiresAt }
}

export function clearedSessionCookieOptions(): CookieOptions {
  return baseOptions()
}

export function readSessionCookieHeader(header: string | undefined) {
  if (!header) {
    return null
  }

  for (const entry of header.split(';')) {
    const separator = entry.indexOf('=')

    if (separator === -1) {
      continue
    }

    if (entry.slice(0, separator).trim() === SESSION_COOKIE_NAME) {
      return decodeURIComponent(entry.slice(separator + 1).trim())
    }
  }

  return null
}
