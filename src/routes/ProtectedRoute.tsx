import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../features/auth/useAuth'
import { Spinner } from '../ui/Spinner/Spinner'
import './ProtectedRoute.css'

export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="rb-route-loading">
        <Spinner label="Checking session" />
      </div>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
