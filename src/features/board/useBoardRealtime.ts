import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { connectSocket } from '../../lib/socket'
import { useAuth } from '../auth/useAuth'
import { applyBoardEvent } from './boardRealtimeSync'
import { CLIENT_EVENTS, SERVER_EVENT_NAMES, joinRoomAcknowledgement } from './realtimeEvents'
import type { RealtimePayload } from './realtimeEvents'
import { boardQueryKey } from './useBoard'

export type RealtimeStatus = 'idle' | 'joined' | 'refused'

export function useBoardRealtime(boardId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [status, setStatus] = useState<RealtimeStatus>('idle')
  const joinedBefore = useRef(false)

  useEffect(() => {
    if (!boardId || !user) {
      return
    }

    const socket = connectSocket()

    if (!socket) {
      return
    }

    const join = () =>
      socket.emit(CLIENT_EVENTS.joinBoard, boardId, (result: unknown) => {
        const { joined } = joinRoomAcknowledgement(result)
        setStatus(joined ? 'joined' : 'refused')

        if (joined && joinedBefore.current) {
          void queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) })
        }

        joinedBefore.current = joinedBefore.current || joined !== null
      })

    const listeners = SERVER_EVENT_NAMES.map(
      (event) =>
        [
          event,
          (payload: RealtimePayload) =>
            applyBoardEvent(queryClient, { boardId, viewerId: user.id }, event, payload),
        ] as const,
    )

    for (const [event, listener] of listeners) {
      socket.on(event, listener)
    }

    socket.on('connect', join)

    if (socket.connected) {
      join()
    }

    return () => {
      for (const [event, listener] of listeners) {
        socket.off(event, listener)
      }

      socket.off('connect', join)
      socket.emit(CLIENT_EVENTS.leaveBoard, boardId)
      setStatus('idle')
    }
  }, [boardId, queryClient, user])

  return status
}
