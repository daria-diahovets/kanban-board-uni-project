import { useState } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { Modal } from '../../ui/Modal/Modal'
import { Radio } from '../../ui/Radio/Radio'
import { Spinner } from '../../ui/Spinner/Spinner'
import type { BoardSummary } from '../../types/api'
import { useMembers } from '../members/useMembers'
import { useTransferOwnership } from './useAdminBoards'

type TransferOwnershipDialogProps = {
  board: BoardSummary
  onClose: () => void
}

export function TransferOwnershipDialog({ board, onClose }: TransferOwnershipDialogProps) {
  const members = useMembers(board.id)
  const transferOwnership = useTransferOwnership()
  const [newOwnerId, setNewOwnerId] = useState<string | null>(null)

  const candidates = (members.data ?? []).filter((member) => member.user.id !== board.owner.id)

  return (
    <Modal
      open
      title={`Transfer ${board.title}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={newOwnerId === null || transferOwnership.isPending}
            onClick={() => {
              if (newOwnerId === null) {
                return
              }

              transferOwnership.mutate({ boardId: board.id, newOwnerId }, { onSuccess: onClose })
            }}
          >
            {transferOwnership.isPending ? 'Transferring' : 'Transfer ownership'}
          </Button>
        </>
      }
    >
      <div className="rb-admin__stack">
        {transferOwnership.error ? (
          <ErrorBanner
            error={transferOwnership.error}
            onDismiss={() => transferOwnership.reset()}
          />
        ) : null}

        <p className="rb-admin__note">
          {board.owner.fullName} owns this board today and becomes a plain member afterwards.
        </p>

        {members.isPending ? <Spinner label="Loading members" /> : null}

        {members.isError ? (
          <ErrorBanner error={members.error} onDismiss={() => void members.refetch()} />
        ) : null}

        {members.data && candidates.length === 0 ? (
          <p className="rb-admin__note">
            This board has no other member to hand it to. Ask the owner to invite one first.
          </p>
        ) : null}

        <div className="rb-admin__options">
          {candidates.map((member) => (
            <Radio
              key={member.user.id}
              name={`new-owner-${board.id}`}
              label={`${member.user.fullName} (${member.role})`}
              value={member.user.id}
              checked={newOwnerId === member.user.id}
              onChange={() => setNewOwnerId(member.user.id)}
            />
          ))}
        </div>
      </div>
    </Modal>
  )
}
