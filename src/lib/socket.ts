import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'

const configuredBaseUrl = import.meta.env?.VITE_API_URL ?? ''

let socket: Socket | null = null

export function connectSocket() {
  if (socket) {
    return socket
  }

  socket = io(configuredBaseUrl.length > 0 ? configuredBaseUrl : undefined, {
    withCredentials: true,
  })

  return socket
}

export function getSocket() {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
  }

  socket = null
}
