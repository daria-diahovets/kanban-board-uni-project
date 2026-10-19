import { createContext } from 'react'
import type { AuthenticatedUser } from '../../types/api'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type SignInInput = {
  email: string
  password: string
}

export type SignUpInput = SignInInput & {
  fullName: string
}

export type AuthContextValue = {
  user: AuthenticatedUser | null
  status: AuthStatus
  signIn: (input: SignInInput) => Promise<void>
  signUp: (input: SignUpInput) => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
