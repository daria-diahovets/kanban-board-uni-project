import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { Input } from '../../ui/Input/Input'
import { AuthCard } from './AuthCard'
import { validateEmail, validateFullName, validateNewPassword } from './credentials'
import { useAuth } from './useAuth'

type FieldErrors = {
  fullName?: string
  email?: string
  password?: string
}

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<unknown>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors: FieldErrors = {
      fullName: validateFullName(fullName),
      email: validateEmail(email),
      password: validateNewPassword(password),
    }

    setFieldErrors(errors)
    setSubmitError(null)

    if (errors.fullName || errors.email || errors.password) {
      return
    }

    setPending(true)

    try {
      await signUp({ fullName: fullName.trim(), email: email.trim(), password })
      void navigate('/', { replace: true })
    } catch (error) {
      setSubmitError(error)
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthCard
      title="Create account"
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form className="rb-auth__form" onSubmit={handleSubmit} noValidate>
        {submitError ? (
          <ErrorBanner error={submitError} onDismiss={() => setSubmitError(null)} />
        ) : null}
        <Input
          label="Full name"
          name="fullName"
          autoComplete="name"
          value={fullName}
          errorText={fieldErrors.fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          errorText={fieldErrors.email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          helperText="At least 8 characters"
          value={password}
          errorText={fieldErrors.password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? 'Creating account' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  )
}
