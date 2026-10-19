import { Link } from 'react-router'
import { useAuth } from '../../features/auth/useAuth'
import { Button } from '../../ui/Button/Button'
import './TopBar.css'

export function TopBar() {
  const { user, signOut } = useAuth()

  return (
    <header className="rb-topbar">
      <Link className="rb-topbar__brand" to="/">
        Kanban Board
      </Link>
      <nav className="rb-topbar__nav" aria-label="Main">
        {user?.systemRole === 'ADMIN' ? (
          <Link className="rb-topbar__link" to="/admin">
            Admin
          </Link>
        ) : null}
        {user ? <span className="rb-topbar__identity">{user.fullName}</span> : null}
        <Button variant="secondary" size="sm" onClick={signOut}>
          Sign out
        </Button>
      </nav>
    </header>
  )
}
