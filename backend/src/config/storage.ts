import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { env } from './env'

export const uploadDirectory = resolve(env.UPLOAD_DIR)

export function storedFilePath(storedName: string) {
  return join(uploadDirectory, storedName)
}

export function ensureUploadDirectory() {
  mkdirSync(uploadDirectory, { recursive: true })
}
