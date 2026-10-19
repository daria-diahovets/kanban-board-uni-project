import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../features/auth/useAuth'
import { Spinner } from '../ui/Spinner/Spinner'
import './ProtectedRoute.css'

export function GuestRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="rb-route-loading">
        <Spinner label="Checking session" />
      </div>
    )
  }

  if (status === 'authenticated') {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
