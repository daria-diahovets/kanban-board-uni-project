import type { Server as HttpServer } from 'node:http'
import type { Socket } from 'socket.io'
import { Server } from 'socket.io'
import { z } from 'zod'
import { env } from '../config/env'
import { ApiError } from '../lib/ApiError'
import { verifyAccessToken } from '../lib/jwt'
import { readSessionCookieHeader } from '../lib/sessionCookie'
import { getBoardAccess } from '../services/boardAccess.service'
import { CLIENT_EVENTS, boardRoom } from './events'

const boardIdSchema = z.uuid()

type RoomAcknowledgement = (result: { joined?: string; left?: string; error?: string }) => void

let server: Server | null = null

function readHandshakeToken(socket: Socket) {
  return readSessionCookieHeader(socket.handshake.headers.cookie)
}

function acknowledge(result: Parameters<RoomAcknowledgement>[0], callback: unknown) {
  if (typeof callback === 'function') {
    ;(callback as RoomAcknowledgement)(result)
  }
}

function socketUser(socket: Socket) {
  const user = socket.data.user

  if (!user) {
    throw ApiError.unauthorized('Socket is not authenticated')
  }

  return user
}

async function handleJoin(socket: Socket, rawBoardId: unknown, callback: unknown) {
  const boardId = boardIdSchema.safeParse(rawBoardId)

  if (!boardId.success) {
    acknowledge({ error: 'A board id is required' }, callback)
    return
  }

  try {
    const access = await getBoardAccess(boardId.data, socketUser(socket))
    await socket.join(boardRoom(access.boardId))
    acknowledge({ joined: access.boardId }, callback)
  } catch (error) {
    acknowledge(
      { error: error instanceof ApiError ? error.message : 'Could not join the board' },
      callback,
    )
  }
}

async function handleLeave(socket: Socket, rawBoardId: unknown, callback: unknown) {
  const boardId = boardIdSchema.safeParse(rawBoardId)

  if (!boardId.success) {
    acknowledge({ error: 'A board id is required' }, callback)
    return
  }

  await socket.leave(boardRoom(boardId.data))
  acknowledge({ left: boardId.data }, callback)
}

export function initializeRealtime(httpServer: HttpServer) {
  server = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  })

  server.use((socket, next) => {
    const token = readHandshakeToken(socket)

    if (!token) {
      next(new Error('A session cookie is required'))
      return
    }

    try {
      const payload = verifyAccessToken(token)
      socket.data.user = { id: payload.sub, email: payload.email, systemRole: payload.systemRole }
      next()
    } catch {
      next(new Error('Authentication token is invalid or expired'))
    }
  })

  server.on('connection', (socket) => {
    socket.on(CLIENT_EVENTS.joinBoard, (boardId: unknown, callback: unknown) => {
      void handleJoin(socket, boardId, callback)
    })

    socket.on(CLIENT_EVENTS.leaveBoard, (boardId: unknown, callback: unknown) => {
      void handleLeave(socket, boardId, callback)
    })
  })

  return server
}

export function getRealtimeServer() {
  return server
}

export async function closeRealtime() {
  if (!server) {
    return
  }

  await server.close()
  server = null
}
