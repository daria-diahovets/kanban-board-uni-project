const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MAX_EMAIL_LENGTH = 255
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 128
const MIN_FULL_NAME_LENGTH = 2
const MAX_FULL_NAME_LENGTH = 120

export function validateEmail(value: string) {
  const email = value.trim()

  if (!email) {
    return 'Email is required'
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    return `Email must be at most ${MAX_EMAIL_LENGTH} characters`
  }

  if (!EMAIL_PATTERN.test(email)) {
    return 'Enter a valid email address'
  }

  return undefined
}

export function validateExistingPassword(value: string) {
  return value ? undefined : 'Password is required'
}

export function validateNewPassword(value: string) {
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  }

  if (value.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters`
  }

  return undefined
}

export function validateFullName(value: string) {
  const fullName = value.trim()

  if (fullName.length < MIN_FULL_NAME_LENGTH) {
    return `Name must be at least ${MIN_FULL_NAME_LENGTH} characters`
  }

  if (fullName.length > MAX_FULL_NAME_LENGTH) {
    return `Name must be at most ${MAX_FULL_NAME_LENGTH} characters`
  }

  return undefined
}
