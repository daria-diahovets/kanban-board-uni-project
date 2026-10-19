import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './apiClient'

const MAX_QUERY_RETRIES = 2

function isWorthRetrying(failureCount: number, error: unknown) {
  if (failureCount >= MAX_QUERY_RETRIES) {
    return false
  }

  if (error instanceof ApiError) {
    return error.status === 0 || error.status >= 500
  }

  return true
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: isWorthRetrying,
    },
    mutations: {
      retry: false,
    },
  },
})
