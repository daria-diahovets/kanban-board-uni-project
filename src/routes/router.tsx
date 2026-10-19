import { createBrowserRouter } from 'react-router'
import { AppShell } from '../components/AppShell/AppShell'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { SessionPanel } from '../features/auth/SessionPanel'
import { GuestRoute } from './GuestRoute'
import { NotFoundPage } from './NotFoundPage'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [{ index: true, element: <SessionPanel /> }],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
