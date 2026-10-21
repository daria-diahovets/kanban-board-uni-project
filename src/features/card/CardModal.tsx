import { useState } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { StatusChip } from '../../ui/Chip/Chip'
import { Modal } from '../../ui/Modal/Modal'
import { Spinner } from '../../ui/Spinner/Spinner'
import type { BoardMembership } from '../../types/api'
import { AssigneePicker } from './AssigneePicker'
import { AttachmentPanel } from './AttachmentPanel'
import { CardDetailsForm } from './CardDetailsForm'
import { ChecklistPanel } from './ChecklistPanel'
import { CommentPanel } from './CommentPanel'
import { LabelPicker } from './LabelPicker'
import { formatTimestamp } from './cardRules'
import { useCard, useDeleteCard, useUpdateCard } from './useCard'
import './CardModal.css'

type CardModalProps = {
  boardId: string
  cardId: string
  members: BoardMembership[]
  editable: boolean
  isBoardOwner: boolean
  onClose: () => void
}

export function CardModal({
  boardId,
  cardId,
  members,
  editable,
  isBoardOwner,
  onClose,
}: CardModalProps) {
  const scope = { boardId, cardId }
  const card = useCard(cardId)
  const updateCard = useUpdateCard(scope)
  const deleteCard = useDeleteCard(scope)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <Modal
      open
      className="rb-card-modal"
      title={card.data?.title ?? 'Card'}
      onClose={onClose}
      footer={
        <>
          {editable && card.data ? (
            <Button
              variant="secondary"
              disabled={updateCard.isPending}
              onClick={() =>
                updateCard.mutate({ isArchived: !card.data.isArchived, version: card.data.version })
              }
            >
              {card.data.isArchived ? 'Un-archive card' : 'Archive card'}
            </Button>
          ) : null}
          {editable && confirmingDelete ? (
            <>
              <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
                Keep it
              </Button>
              <Button
                variant="destructive"
                disabled={deleteCard.isPending}
                onClick={() => deleteCard.mutate(undefined, { onSuccess: onClose })}
              >
                {deleteCard.isPending ? 'Deleting' : 'Delete for good'}
              </Button>
            </>
          ) : null}
          {editable && !confirmingDelete ? (
            <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>
              Delete card
            </Button>
          ) : null}
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      {card.isPending ? <Spinner label="Loading card" /> : null}

      {card.isError ? (
        <ErrorBanner error={card.error} onDismiss={() => void card.refetch()} />
      ) : null}

      {deleteCard.error ? (
        <ErrorBanner error={deleteCard.error} onDismiss={() => deleteCard.reset()} />
      ) : null}

      {card.data ? (
        <div className="rb-card-modal__body">
          <div className="rb-card-modal__row">
            {card.data.isArchived ? <StatusChip tone="warning">Archived</StatusChip> : null}
            {!editable ? <StatusChip>Read only</StatusChip> : null}
          </div>

          <p className="rb-card-modal__note">
            Created by {card.data.createdBy.fullName} · updated{' '}
            {formatTimestamp(card.data.updatedAt)} · version {card.data.version}
          </p>

          <CardDetailsForm key={card.data.id} scope={scope} card={card.data} editable={editable} />

          <section className="rb-card-modal__section">
            <h4 className="rb-card-modal__heading">Labels</h4>
            <LabelPicker scope={scope} cardLabels={card.data.labels} editable={editable} />
          </section>

          <section className="rb-card-modal__section">
            <h4 className="rb-card-modal__heading">Assignees</h4>
            <AssigneePicker
              scope={scope}
              members={members}
              assignees={card.data.assignees}
              editable={editable}
            />
          </section>

          <section className="rb-card-modal__section">
            <h4 className="rb-card-modal__heading">Checklist</h4>
            <ChecklistPanel scope={scope} editable={editable} />
          </section>

          <section className="rb-card-modal__section">
            <h4 className="rb-card-modal__heading">Attachments</h4>
            <AttachmentPanel scope={scope} editable={editable} />
          </section>

          <section className="rb-card-modal__section">
            <h4 className="rb-card-modal__heading">Comments</h4>
            <CommentPanel scope={scope} editable={editable} isBoardOwner={isBoardOwner} />
          </section>
        </div>
      ) : null}
    </Modal>
  )
}
