import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { Attachment } from '../../types/api'
import { attachmentsQueryKey, useCardMutation } from './cardQueries'
import type { CardScope } from './cardQueries'

export function useAttachments(cardId: string | null) {
  return useQuery({
    queryKey: attachmentsQueryKey(cardId ?? ''),
    queryFn: () =>
      apiClient
        .get<{ attachments: Attachment[] }>(`/cards/${cardId}/attachments`)
        .then(({ attachments }) => attachments),
    enabled: cardId !== null,
  })
}

export function useUploadAttachment(scope: CardScope) {
  return useCardMutation(
    scope,
    (file: File) => {
      const payload = new FormData()
      payload.append('file', file)

      return apiClient.post(`/cards/${scope.cardId}/attachments`, payload)
    },
    [attachmentsQueryKey(scope.cardId)],
  )
}

export function useDeleteAttachment(scope: CardScope) {
  return useCardMutation(
    scope,
    (attachmentId: string) => apiClient.delete(`/attachments/${attachmentId}`),
    [attachmentsQueryKey(scope.cardId)],
  )
}

export async function downloadAttachment(attachment: Attachment) {
  const blob = await apiClient.blob(`/attachments/${attachment.id}/download`)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = attachment.fileName
  link.click()
  URL.revokeObjectURL(url)
}
