import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { Input } from '../../ui/Input/Input'
import { Radio } from '../../ui/Radio/Radio'
import { validateEmail } from '../auth/credentials'
import { useInviteMember } from './useMembers'
import type { AssignableRole } from './useMembers'

const ASSIGNABLE_ROLES: AssignableRole[] = ['MEMBER', 'VIEWER']

type InviteMemberFormProps = {
  boardId: string
}

export function InviteMemberForm({ boardId }: InviteMemberFormProps) {
  const inviteMember = useInviteMember(boardId)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AssignableRole>('MEMBER')
  const [emailError, setEmailError] = useState<string | undefined>(undefined)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const error = validateEmail(email)
    setEmailError(error)

    if (error) {
      return
    }

    inviteMember.mutate({ email: email.trim(), role }, { onSuccess: () => setEmail('') })
  }

  return (
    <form className="rb-members__form" onSubmit={submit} noValidate>
      {inviteMember.error ? (
        <ErrorBanner error={inviteMember.error} onDismiss={() => inviteMember.reset()} />
      ) : null}
      <Input
        label="Invite by email"
        name="inviteEmail"
        type="email"
        value={email}
        errorText={emailError}
        helperText="The person must already have an account"
        onChange={(event) => setEmail(event.target.value)}
      />
      <div className="rb-members__roles">
        {ASSIGNABLE_ROLES.map((assignable) => (
          <Radio
            key={assignable}
            name="inviteRole"
            label={assignable}
            value={assignable}
            checked={role === assignable}
            onChange={() => setRole(assignable)}
          />
        ))}
      </div>
      <Button type="submit" size="sm" disabled={inviteMember.isPending}>
        {inviteMember.isPending ? 'Inviting' : 'Send invite'}
      </Button>
    </form>
  )
}
