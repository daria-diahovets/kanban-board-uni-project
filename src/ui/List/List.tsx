import type { HTMLAttributes, LiHTMLAttributes, ReactNode } from 'react'
import { classNames } from '../../lib/classNames'
import './List.css'

type ListProps = HTMLAttributes<HTMLUListElement> & {
  children: ReactNode
}

type ListItemProps = LiHTMLAttributes<HTMLLIElement> & {
  selected?: boolean
  children: ReactNode
}

export function List({ className, children, ...rest }: ListProps) {
  return (
    <ul className={classNames('rb-list', className)} {...rest}>
      {children}
    </ul>
  )
}

export function ListItem({ selected = false, className, children, ...rest }: ListItemProps) {
  return (
    <li
      className={classNames('rb-list__item', selected && 'rb-list__item--selected', className)}
      {...rest}
    >
      {children}
    </li>
  )
}
