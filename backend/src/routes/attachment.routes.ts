import { Router } from 'express'
import {
  downloadAttachment,
  listAttachments,
  postAttachment,
  removeAttachment,
} from '../controllers/attachment.controller'
import { authenticate } from '../middleware/authenticate'
import { authorizeBoard } from '../middleware/authorizeBoard'
import { uploadSingleFile } from '../middleware/upload'
import { validate } from '../middleware/validate'
import {
  attachmentParamsSchema,
  cardAttachmentsParamsSchema,
} from '../validators/attachment.validators'

export const cardAttachmentsRouter = Router({ mergeParams: true })

cardAttachmentsRouter.get(
  '/',
  validate({ params: cardAttachmentsParamsSchema }),
  authorizeBoard('VIEWER'),
  listAttachments,
)

cardAttachmentsRouter.post(
  '/',
  validate({ params: cardAttachmentsParamsSchema }),
  authorizeBoard('MEMBER'),
  uploadSingleFile,
  postAttachment,
)

export const attachmentRouter = Router()

attachmentRouter.use(authenticate)

attachmentRouter.get(
  '/:attachmentId/download',
  validate({ params: attachmentParamsSchema }),
  authorizeBoard('VIEWER'),
  downloadAttachment,
)

attachmentRouter.delete(
  '/:attachmentId',
  validate({ params: attachmentParamsSchema }),
  authorizeBoard('MEMBER'),
  removeAttachment,
)
