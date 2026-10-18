import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import multer from 'multer'
import { env } from '../config/env'
import { ensureUploadDirectory, uploadDirectory } from '../config/storage'
import { ApiError } from '../lib/ApiError'

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/zip',
]

ensureUploadDirectory()

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadDirectory)
  },
  filename: (_request, file, callback) => {
    callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`)
  },
})

export const uploadSingleFile = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.mimetype)) {
      callback(ApiError.badRequest(`File type ${file.mimetype} is not allowed`))
      return
    }

    callback(null, true)
  },
}).single('file')
