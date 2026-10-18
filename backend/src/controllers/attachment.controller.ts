import type { RequestHandler } from 'express'
import { ApiError } from '../lib/ApiError'
import { requireUser } from '../middleware/authenticate'
import {
  createAttachment,
  deleteAttachment,
  getAttachmentForDownload,
  listCardAttachments,
} from '../services/attachment.service'
import type { AttachmentParams, CardAttachmentsParams } from '../validators/attachment.validators'

export const listAttachments: RequestHandler = async (request, response) => {
  const { cardId } = request.validated.params as CardAttachmentsParams
  const attachments = await listCardAttachments(cardId)
  response.json({ attachments })
}

export const postAttachment: RequestHandler = async (request, response) => {
  const { cardId } = request.validated.params as CardAttachmentsParams

  if (!request.file) {
    throw ApiError.badRequest('A file is required in the "file" field')
  }

  const attachment = await createAttachment(cardId, requireUser(request).id, request.file)
  response.status(201).json({ attachment })
}

export const downloadAttachment: RequestHandler = async (request, response, next) => {
  const { attachmentId } = request.validated.params as AttachmentParams
  const { absolutePath, fileName, mimeType } = await getAttachmentForDownload(attachmentId)

  response.type(mimeType)
  response.download(absolutePath, fileName, (error) => {
    if (!error) {
      return
    }

    if (response.headersSent) {
      response.end()
      return
    }

    next(ApiError.notFound('Stored file is missing'))
  })
}

export const removeAttachment: RequestHandler = async (request, response) => {
  const { attachmentId } = request.validated.params as AttachmentParams
  await deleteAttachment(attachmentId)
  response.status(204).send()
}
