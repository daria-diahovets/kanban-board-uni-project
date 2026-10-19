import { useContext } from 'react'
import { AuthContext } from './authContext'

export function useAuth() {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error('useAuth must be called inside an AuthProvider')
  }

  return value
}
