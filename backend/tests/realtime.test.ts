import { createServer } from 'node:http'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { io as connect } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { emitToBoard } from '../src/realtime/emit'
import { closeRealtime, initializeRealtime } from '../src/realtime/io'
import { api, bearer } from './helpers/api'
import {
  addBoardMember,
  createBoard,
  createCard,
  createColumn,
  createUser,
} from './helpers/factories'
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

describe('broadcasts after mutations', () => {
  async function boardWithMemberSocket() {
    const owner = await createUser({ fullName: 'Owner' })
    const member = await createUser({ fullName: 'Member' })
    const board = await createBoard(owner.id, { title: 'Live board' })

    await addBoardMember(board.id, member.id, 'MEMBER')

    const column = await createColumn(board.id, { title: 'Todo' })
    const listener = await connectedSocket(owner)

    expect(await joinBoard(listener, board.id)).toEqual({ joined: board.id })

    return { owner, member, board, column, listener }
  }

  function asUser(user: TestUser) {
    return bearer(user.token)
  }

  it('announces a created card', async () => {
    const { member, board, column, listener } = await boardWithMemberSocket()
    const event = nextEvent(listener, 'card:created')

    await api()
      .post(`/api/columns/${column.id}/cards`)
      .set('authorization', asUser(member))
      .send({ title: 'Broadcast me' })

    expect(await event).toMatchObject({
      boardId: board.id,
      actorId: member.id,
      card: { title: 'Broadcast me', columnId: column.id },
    })
  })

  it('announces an updated, moved and deleted card', async () => {
    const { owner, member, column, listener } = await boardWithMemberSocket()
    const card = await createCard(column.id, owner.id, { title: 'Subject' })

    const updated = nextEvent(listener, 'card:updated')
    await api()
      .patch(`/api/cards/${card.id}`)
      .set('authorization', asUser(member))
      .send({ title: 'Renamed' })

    expect(await updated).toMatchObject({ actorId: member.id, card: { title: 'Renamed' } })

    const moved = nextEvent(listener, 'card:moved')
    await api()
      .post(`/api/cards/${card.id}/move`)
      .set('authorization', asUser(member))
      .send({ targetColumnId: column.id })

    expect(await moved).toMatchObject({ actorId: member.id, card: { id: card.id } })

    const deleted = nextEvent(listener, 'card:deleted')
    await api().delete(`/api/cards/${card.id}`).set('authorization', asUser(member))

    expect(await deleted).toMatchObject({
      actorId: member.id,
      cardId: card.id,
      columnId: column.id,
    })
  })

  it('announces a card update when a checklist item is added', async () => {
    const { owner, member, column, listener } = await boardWithMemberSocket()
    const card = await createCard(column.id, owner.id, { title: 'With checklist' })
    const event = nextEvent(listener, 'card:updated')

    await api()
      .post(`/api/cards/${card.id}/checklist`)
      .set('authorization', asUser(member))
      .send({ text: 'Step one' })

    expect(await event).toMatchObject({
      actorId: member.id,
      cardId: card.id,
      checklistItem: { text: 'Step one' },
    })
  })

  it('announces created, updated and deleted comments', async () => {
    const { owner, member, column, listener } = await boardWithMemberSocket()
    const card = await createCard(column.id, owner.id, { title: 'Discussed' })

    const created = nextEvent(listener, 'comment:created')
    const posted = await api()
      .post(`/api/cards/${card.id}/comments`)
      .set('authorization', asUser(member))
      .send({ body: 'First' })

    expect(await created).toMatchObject({
      actorId: member.id,
      cardId: card.id,
      comment: { body: 'First' },
    })

    const updated = nextEvent(listener, 'comment:updated')
    await api()
      .patch(`/api/comments/${posted.body.comment.id}`)
      .set('authorization', asUser(member))
      .send({ body: 'Second thoughts' })

    expect(await updated).toMatchObject({ comment: { body: 'Second thoughts' } })

    const deleted = nextEvent(listener, 'comment:deleted')
    await api()
      .delete(`/api/comments/${posted.body.comment.id}`)
      .set('authorization', asUser(member))

    expect(await deleted).toMatchObject({
      actorId: member.id,
      cardId: card.id,
      commentId: posted.body.comment.id,
    })
  })

  it('announces column creation and reordering', async () => {
    const { owner, board, column, listener } = await boardWithMemberSocket()

    const created = nextEvent(listener, 'column:created')
    await api()
      .post(`/api/boards/${board.id}/columns`)
      .set('authorization', asUser(owner))
      .send({ title: 'Doing' })

    expect(await created).toMatchObject({ actorId: owner.id, column: { title: 'Doing' } })

    const moved = nextEvent(listener, 'column:moved')
    await api().post(`/api/columns/${column.id}/move`).set('authorization', asUser(owner)).send({})

    expect(await moved).toMatchObject({ actorId: owner.id, column: { id: column.id } })

    const deleted = nextEvent(listener, 'column:deleted')
    await api().delete(`/api/columns/${column.id}`).set('authorization', asUser(owner))

    expect(await deleted).toMatchObject({ actorId: owner.id, columnId: column.id })
  })

  it('announces member changes', async () => {
    const { owner, board, listener } = await boardWithMemberSocket()
    const invitee = await createUser({ fullName: 'Invitee' })

    const added = nextEvent(listener, 'member:added')
    await api()
      .post(`/api/boards/${board.id}/members`)
      .set('authorization', asUser(owner))
      .send({ email: invitee.email, role: 'VIEWER' })

    expect(await added).toMatchObject({ actorId: owner.id, member: { role: 'VIEWER' } })

    const roleChanged = nextEvent(listener, 'member:role-changed')
    await api()
      .patch(`/api/boards/${board.id}/members/${invitee.id}`)
      .set('authorization', asUser(owner))
      .send({ role: 'MEMBER' })

    expect(await roleChanged).toMatchObject({ member: { role: 'MEMBER' } })

    const removed = nextEvent(listener, 'member:removed')
    await api()
      .delete(`/api/boards/${board.id}/members/${invitee.id}`)
      .set('authorization', asUser(owner))

    expect(await removed).toMatchObject({ actorId: owner.id, userId: invitee.id })
  })

  it('announces board update, archive and deletion', async () => {
    const { owner, board, listener } = await boardWithMemberSocket()

    const updated = nextEvent(listener, 'board:updated')
    await api()
      .patch(`/api/boards/${board.id}`)
      .set('authorization', asUser(owner))
      .send({ title: 'Renamed board' })

    expect(await updated).toMatchObject({ actorId: owner.id, board: { title: 'Renamed board' } })

    const archived = nextEvent(listener, 'board:archived')
    await api()
      .patch(`/api/boards/${board.id}/archive`)
      .set('authorization', asUser(owner))
      .send({ isArchived: true })

    expect(await archived).toMatchObject({ actorId: owner.id, isArchived: true })

    const deleted = nextEvent(listener, 'board:deleted')
    await api().delete(`/api/boards/${board.id}`).set('authorization', asUser(owner))

    expect(await deleted).toMatchObject({ actorId: owner.id, boardId: board.id })
  })

  it('never leaks an event into another board room', async () => {
    const { member, column, listener } = await boardWithMemberSocket()
    const otherOwner = await createUser()
    const otherBoard = await createBoard(otherOwner.id, { title: 'Other board' })
    const otherColumn = await createColumn(otherBoard.id, { title: 'Elsewhere' })

    const leaked = nextEvent(listener, 'card:created')

    await api()
      .post(`/api/columns/${otherColumn.id}/cards`)
      .set('authorization', asUser(otherOwner))
      .send({ title: 'Not yours' })

    expect(await leaked).toBeNull()

    const expected = nextEvent(listener, 'card:created')

    await api()
      .post(`/api/columns/${column.id}/cards`)
      .set('authorization', asUser(member))
      .send({ title: 'Yours' })

    expect(await expected).toMatchObject({ card: { title: 'Yours' } })
  })
})
