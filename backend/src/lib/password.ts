import bcrypt from 'bcrypt'

const BCRYPT_ROUNDS = 10

const DUMMY_PASSWORD_HASH = bcrypt.hashSync('invalid-password-placeholder', BCRYPT_ROUNDS)

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

export function burnPasswordComparison(password: string) {
  return bcrypt.compare(password, DUMMY_PASSWORD_HASH)
}
