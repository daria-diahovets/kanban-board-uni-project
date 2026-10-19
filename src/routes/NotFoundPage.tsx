import { Link } from 'react-router'
import './NotFoundPage.css'

export function NotFoundPage() {
  return (
    <div className="rb-not-found">
      <h1 className="rb-not-found__code">404</h1>
      <p className="rb-not-found__text">This page does not exist.</p>
      <Link className="rb-not-found__link" to="/">
        Back to boards
      </Link>
    </div>
  )
}
