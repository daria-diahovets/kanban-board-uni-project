import { createBrowserRouter } from 'react-router'
import { AppShell } from '../components/AppShell/AppShell'
import { AdminBoardsPage } from '../features/admin/AdminBoardsPage'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { BoardPage } from '../features/board/BoardPage'
import { BoardListPage } from '../features/boards/BoardListPage'
import { PublicBoardPage } from '../features/guest/PublicBoardPage'
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
        children: [
          { index: true, element: <BoardListPage /> },
          { path: 'boards/:boardId', element: <BoardPage /> },
          { path: 'admin', element: <AdminBoardsPage /> },
        ],
      },
    ],
  },
  { path: '/public/boards/:token', element: <PublicBoardPage /> },
  { path: '*', element: <NotFoundPage /> },
])
