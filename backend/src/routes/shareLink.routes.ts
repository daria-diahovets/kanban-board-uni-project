import { Router } from 'express'
import { deleteShareLink, getShareLink, postShareLink } from '../controllers/shareLink.controller'
import { authorizeBoard } from '../middleware/authorizeBoard'
import { validate } from '../middleware/validate'
import {
  createShareLinkSchema,
  shareLinkBoardParamsSchema,
} from '../validators/shareLink.validators'

export const shareLinkRouter = Router({ mergeParams: true })

shareLinkRouter.get(
  '/',
  validate({ params: shareLinkBoardParamsSchema }),
  authorizeBoard('OWNER', { allowArchived: true }),
  getShareLink,
)

shareLinkRouter.post(
  '/',
  validate({ params: shareLinkBoardParamsSchema, body: createShareLinkSchema }),
  authorizeBoard('OWNER'),
  postShareLink,
)

shareLinkRouter.delete(
  '/',
  validate({ params: shareLinkBoardParamsSchema }),
  authorizeBoard('OWNER', { allowArchived: true }),
  deleteShareLink,
)
