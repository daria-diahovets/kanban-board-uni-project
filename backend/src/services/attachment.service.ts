import { unlink } from 'node:fs/promises'
import { prisma } from '../config/prisma'
import { storedFilePath } from '../config/storage'
import { ApiError } from '../lib/ApiError'

const ATTACHMENT_SELECT = {
  id: true,
  cardId: true,
  fileName: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
  uploadedBy: { select: { id: true, email: true, fullName: true } },
} as const

type StoredFile = {
  originalname: string
  filename: string
  mimetype: string
  size: number
}

async function removeStoredFile(storedName: string) {
  try {
    await unlink(storedFilePath(storedName))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }
}

export async function listCardAttachments(cardId: string) {
  return prisma.attachment.findMany({
    where: { cardId },
    select: ATTACHMENT_SELECT,
    orderBy: { createdAt: 'asc' },
  })
}

export async function createAttachment(cardId: string, uploadedById: string, file: StoredFile) {
  try {
    return await prisma.attachment.create({
      data: {
        cardId,
        uploadedById,
        fileName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
      select: ATTACHMENT_SELECT,
    })
  } catch (error) {
    await removeStoredFile(file.filename)
    throw error
  }
}

export async function getAttachmentForDownload(attachmentId: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    select: { fileName: true, storedName: true, mimeType: true },
  })

  if (!attachment) {
    throw ApiError.notFound('Attachment not found')
  }

  return {
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    absolutePath: storedFilePath(attachment.storedName),
  }
}

export async function deleteAttachment(attachmentId: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    select: { storedName: true },
  })

  if (!attachment) {
    throw ApiError.notFound('Attachment not found')
  }

  await prisma.attachment.delete({ where: { id: attachmentId } })
  await removeStoredFile(attachment.storedName)
}
