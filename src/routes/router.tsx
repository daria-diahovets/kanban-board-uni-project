import { createBrowserRouter } from 'react-router'
import { AppShell } from '../components/AppShell/AppShell'
import { SessionPanel } from '../features/auth/SessionPanel'
import { NotFoundPage } from './NotFoundPage'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
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
