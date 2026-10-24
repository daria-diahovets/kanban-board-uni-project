import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import { disconnectSocket } from '../../lib/socket'
import type { AuthResponse, AuthenticatedUser } from '../../types/api'
import { AuthContext } from './authContext'
import type { AuthStatus, SignInInput, SignUpInput } from './authContext'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let cancelled = false

    apiClient
      .get<{ user: AuthenticatedUser }>('/auth/me')
      .then((payload) => {
        if (cancelled) {
          return
        }

        setUser(payload.user)
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        setUser(null)
        setStatus('anonymous')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const authenticate = useCallback(
    async (path: string, body: SignInInput | SignUpInput) => {
      const payload = await apiClient.post<AuthResponse>(path, body)

      disconnectSocket()
      queryClient.clear()
      setUser(payload.user)
      setStatus('authenticated')
    },
    [queryClient],
  )

  const value = useMemo(
    () => ({
      user,
      status,
      signIn: (input: SignInInput) => authenticate('/auth/login', input),
      signUp: (input: SignUpInput) => authenticate('/auth/register', input),
      signOut: () => {
        disconnectSocket()
        void apiClient.post('/auth/logout').catch(() => undefined)
        queryClient.clear()
        setUser(null)
        setStatus('anonymous')
      },
    }),
    [authenticate, queryClient, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
