import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { getAuthToken } from './apiClient'

const configuredBaseUrl = import.meta.env?.VITE_API_URL ?? ''

let socket: Socket | null = null
let connectedToken: string | null = null

export function connectSocket() {
  const token = getAuthToken()

  if (!token) {
    disconnectSocket()
    return null
  }

  if (socket && connectedToken === token) {
    return socket
  }

  disconnectSocket()

  socket = io(configuredBaseUrl.length > 0 ? configuredBaseUrl : undefined, {
    auth: { token },
    withCredentials: true,
  })
  connectedToken = token

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
  connectedToken = null
}
