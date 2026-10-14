import type { AccessTokenPayload } from '../lib/jwt'

declare global {
  namespace Express {
    interface Request {
      validated: {
        body?: unknown
        params?: unknown
        query?: unknown
      }
      user?: {
        id: string
        email: string
        systemRole: AccessTokenPayload['systemRole']
      }
    }
  }
}

export {}
