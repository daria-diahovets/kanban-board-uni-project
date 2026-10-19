import { Outlet } from 'react-router'
import { TopBar } from '../TopBar/TopBar'
import './AppShell.css'

export function AppShell() {
  return (
    <div className="rb-shell">
      <TopBar />
      <main className="rb-shell__main">
        <Outlet />
      </main>
    </div>
  )
}
