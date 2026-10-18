import { createServer } from 'node:http'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { io as connect } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { emitToBoard } from '../src/realtime/emit'
import { closeRealtime, initializeRealtime } from '../src/realtime/io'
import { createBoard, createUser } from './helpers/factories'
import type { TestUser } from './helpers/factories'

let httpServer: Server
let serverUrl: string
const openSockets: Socket[] = []

beforeEach(async () => {
  httpServer = createServer(createApp())
  initializeRealtime(httpServer)

  await new Promise<void>((resolve) => {
    httpServer.listen(0, resolve)
  })

  const address = httpServer.address() as AddressInfo
  serverUrl = `http://127.0.0.1:${address.port}`
})

afterEach(async () => {
  for (const socket of openSockets.splice(0)) {
    socket.disconnect()
  }

  await closeRealtime()
  await new Promise<void>((resolve) => {
    httpServer.close(() => resolve())
  })
})

function openSocket(token?: string) {
  const socket = connect(serverUrl, {
    transports: ['websocket'],
    reconnection: false,
    ...(token === undefined ? {} : { auth: { token } }),
  })

  openSockets.push(socket)

  return socket
}

function connectionOutcome(socket: Socket) {
  return new Promise<{ connected: boolean; message?: string }>((resolve) => {
    socket.on('connect', () => resolve({ connected: true }))
    socket.on('connect_error', (error) => resolve({ connected: false, message: error.message }))
  })
}

function joinBoard(socket: Socket, boardId: string) {
  return new Promise<{ joined?: string; left?: string; error?: string }>((resolve) => {
    socket.emit('board:join', boardId, resolve)
  })
}

function leaveBoard(socket: Socket, boardId: string) {
  return new Promise<{ joined?: string; left?: string; error?: string }>((resolve) => {
    socket.emit('board:leave', boardId, resolve)
  })
}

function nextEvent(socket: Socket, event: string, timeoutMs = 300) {
  return new Promise<Record<string, unknown> | null>((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs)

    socket.once(event, (payload: Record<string, unknown>) => {
      clearTimeout(timer)
      resolve(payload)
    })
  })
}

async function connectedSocket(user: TestUser) {
  const socket = openSocket(user.token)
  const outcome = await connectionOutcome(socket)

  expect(outcome.connected).toBe(true)

  return socket
}

describe('socket io handshake', () => {
  it('rejects a connection without a token', async () => {
    const outcome = await connectionOutcome(openSocket())

    expect(outcome.connected).toBe(false)
    expect(outcome.message).toContain('token is required')
  })

  it('rejects a malformed token', async () => {
    const outcome = await connectionOutcome(openSocket('not.a.real.token'))

    expect(outcome.connected).toBe(false)
    expect(outcome.message).toContain('invalid or expired')
  })

  it('accepts a valid access token', async () => {
    const user = await createUser()
    const outcome = await connectionOutcome(openSocket(user.token))

    expect(outcome.connected).toBe(true)
  })

  it('accepts the token from an authorization header too', async () => {
    const user = await createUser()
    const socket = connect(serverUrl, {
      transports: ['websocket'],
      reconnection: false,
      extraHeaders: { authorization: `Bearer ${user.token}` },
    })

    openSockets.push(socket)

    expect((await connectionOutcome(socket)).connected).toBe(true)
  })
})

describe('board rooms', () => {
  it('delivers board events only to the members who joined the room', async () => {
    const owner = await createUser()
    const outsider = await createUser()
    const board = await createBoard(owner.id, { title: 'Shared board' })

    const ownerSocket = await connectedSocket(owner)
    const outsiderSocket = await connectedSocket(outsider)

    expect(await joinBoard(ownerSocket, board.id)).toEqual({ joined: board.id })
    expect((await joinBoard(outsiderSocket, board.id)).error).toContain('do not have access')

    const ownerEvent = nextEvent(ownerSocket, 'card:moved')
    const outsiderEvent = nextEvent(outsiderSocket, 'card:moved')

    emitToBoard(board.id, 'card:moved', { actorId: owner.id, cardId: 'abc' })

    expect(await ownerEvent).toMatchObject({
      boardId: board.id,
      actorId: owner.id,
      cardId: 'abc',
    })
    expect(await outsiderEvent).toBeNull()
  })

  it('stops delivering after leaving the room', async () => {
    const owner = await createUser()
    const board = await createBoard(owner.id)
    const socket = await connectedSocket(owner)

    await joinBoard(socket, board.id)

    expect(await leaveBoard(socket, board.id)).toEqual({ left: board.id })

    const afterLeaving = nextEvent(socket, 'board:updated')
    emitToBoard(board.id, 'board:updated', { actorId: owner.id })

    expect(await afterLeaving).toBeNull()
  })

  it('reports a missing board and a malformed id through the acknowledgement', async () => {
    const user = await createUser()
    const socket = await connectedSocket(user)

    expect((await joinBoard(socket, 'not-a-uuid')).error).toContain('board id is required')
    expect((await joinBoard(socket, '00000000-0000-4000-8000-000000000000')).error).toContain(
      'Board not found',
    )
  })

  it('lets an admin join a board it is not a member of', async () => {
    const owner = await createUser()
    const admin = await createUser({ systemRole: 'ADMIN' })
    const board = await createBoard(owner.id)
    const socket = await connectedSocket(admin)

    expect(await joinBoard(socket, board.id)).toEqual({ joined: board.id })
  })
})

describe('emitToBoard without a realtime server', () => {
  it('does nothing instead of throwing', async () => {
    const owner = await createUser()
    const board = await createBoard(owner.id)

    await closeRealtime()

    expect(() => emitToBoard(board.id, 'board:updated', { actorId: null })).not.toThrow()
  })
})
