import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { classNames } from '../../lib/classNames'
import './Modal.css'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Modal({ open, title, onClose, children, footer, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (open && !dialog.open) {
      dialog.showModal()
    }

    if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={classNames('rb-modal', className)}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClose={onClose}
    >
      <div className="rb-modal__header">
        <h3 className="rb-modal__title">{title}</h3>
        <button type="button" className="rb-modal__close" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="rb-modal__body">{children}</div>
      {footer ? <div className="rb-modal__footer">{footer}</div> : null}
    </dialog>
  )
}
