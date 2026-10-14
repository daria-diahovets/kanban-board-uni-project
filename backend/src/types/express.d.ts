import type { AccessTokenPayload } from '../lib/jwt'
import type { BoardAccess } from '../services/boardAccess.service'

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
      boardAccess?: BoardAccess
    }
  }
}

export {}
