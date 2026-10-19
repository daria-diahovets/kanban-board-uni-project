import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner'
import { Button } from '../../ui/Button/Button'
import { Input } from '../../ui/Input/Input'
import { AuthCard } from './AuthCard'
import { validateEmail, validateExistingPassword } from './credentials'
import { useAuth } from './useAuth'

type FieldErrors = {
  email?: string
  password?: string
}

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<unknown>(null)
  const [pending, setPending] = useState(false)

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors: FieldErrors = {
      email: validateEmail(email),
      password: validateExistingPassword(password),
    }

    setFieldErrors(errors)
    setSubmitError(null)

    if (errors.email || errors.password) {
      return
    }

    setPending(true)

    try {
      await signIn({ email: email.trim(), password })
      void navigate(redirectTo, { replace: true })
    } catch (error) {
      setSubmitError(error)
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthCard
      title="Sign in"
      footer={
        <>
          No account yet? <Link to="/register">Create one</Link>
        </>
      }
    >
      <form className="rb-auth__form" onSubmit={handleSubmit} noValidate>
        {submitError ? (
          <ErrorBanner error={submitError} onDismiss={() => setSubmitError(null)} />
        ) : null}
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
          autoComplete="current-password"
          value={password}
          errorText={fieldErrors.password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? 'Signing in' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  )
}
