import type { ReactNode } from 'react'
import { Card } from '../../ui/Card/Card'
import './AuthCard.css'

type AuthCardProps = {
  title: string
  children: ReactNode
  footer: ReactNode
}

export function AuthCard({ title, children, footer }: AuthCardProps) {
  return (
    <div className="rb-auth">
      <Card variant="elevated" className="rb-auth__card">
        <h1 className="rb-auth__title">{title}</h1>
        {children}
        <p className="rb-auth__footer">{footer}</p>
      </Card>
    </div>
  )
}
