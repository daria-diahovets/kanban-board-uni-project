import { beforeEach, describe, expect, it } from 'vitest'
import type { Response } from 'supertest'
import { prisma } from '../src/config/prisma'
import { api, bearer } from './helpers/api'
import {
  addBoardMember,
  createBoard,
  createCard,
  createColumn,
  createLabel,
  createUser,
} from './helpers/factories'
import type { TestUser } from './helpers/factories'
import { sorted } from './helpers/items'

type Fixture = {
  owner: TestUser
  member: TestUser
  viewer: TestUser
  admin: TestUser
  outsider: TestUser
  boardId: string
  columnId: string
  cardId: string
  labelId: string
}

let fixture: Fixture

beforeEach(async () => {
  const owner = await createUser({ fullName: 'Board Owner' })
  const member = await createUser({ fullName: 'Board Member' })
  const viewer = await createUser({ fullName: 'Board Viewer' })
  const admin = await createUser({ fullName: 'System Admin', systemRole: 'ADMIN' })
  const outsider = await createUser({ fullName: 'Nobody' })
  const board = await createBoard(owner.id, { title: 'Roadmap' })

  await addBoardMember(board.id, member.id, 'MEMBER')
  await addBoardMember(board.id, viewer.id, 'VIEWER')

  const column = await createColumn(board.id, { title: 'Todo' })
  const card = await createCard(column.id, owner.id, { title: 'Existing card' })
  const label = await createLabel(board.id, { name: 'Urgent' })

  fixture = {
    owner,
    member,
    viewer,
    admin,
    outsider,
    boardId: board.id,
    columnId: column.id,
    cardId: card.id,
    labelId: label.id,
  }
})

function asUser(user: TestUser) {
  return bearer(user.token)
}

describe('GET /api/boards', () => {
  it('returns only the boards the caller is a member of', async () => {
    const otherOwner = await createUser()
    await createBoard(otherOwner.id, { title: 'Somebody else board' })

    const forOwner = await api().get('/api/boards').set('authorization', asUser(fixture.owner))
    const forViewer = await api().get('/api/boards').set('authorization', asUser(fixture.viewer))
    const forOutsider = await api()
      .get('/api/boards')
      .set('authorization', asUser(fixture.outsider))

    expect(forOwner.body.boards.map((board: { title: string }) => board.title)).toEqual(['Roadmap'])
    expect(forViewer.body.boards.map((board: { title: string }) => board.title)).toEqual([
      'Roadmap',
    ])
    expect(forOutsider.body.boards).toEqual([])
  })

  it('does not widen the list for an admin', async () => {
    const forAdmin = await api().get('/api/boards').set('authorization', asUser(fixture.admin))

    expect(forAdmin.body.boards).toEqual([])
  })

  it('requires authentication', async () => {
    expect((await api().get('/api/boards')).status).toBe(401)
  })
})

describe('board mutations', () => {
  it('lets the owner rename, archive, un-archive and delete the board', async () => {
    const renamed = await api()
      .patch(`/api/boards/${fixture.boardId}`)
      .set('authorization', asUser(fixture.owner))
      .send({ title: 'Roadmap 2027', description: 'Next year' })

    expect(renamed.status).toBe(200)
    expect(renamed.body.board).toMatchObject({ title: 'Roadmap 2027', description: 'Next year' })

    const archived = await api()
      .patch(`/api/boards/${fixture.boardId}/archive`)
      .set('authorization', asUser(fixture.owner))
      .send({ isArchived: true })

    expect(archived.status).toBe(200)
    expect(archived.body.board.isArchived).toBe(true)

    const blocked = await api()
      .post(`/api/columns/${fixture.columnId}/cards`)
      .set('authorization', asUser(fixture.member))
      .send({ title: 'Not while archived' })

    expect(blocked.status).toBe(403)
    expect(blocked.body.error.message).toContain('archived')

    const stillReadable = await api()
      .get(`/api/boards/${fixture.boardId}`)
      .set('authorization', asUser(fixture.viewer))

    expect(stillReadable.status).toBe(200)

    const restored = await api()
      .patch(`/api/boards/${fixture.boardId}/archive`)
      .set('authorization', asUser(fixture.owner))
      .send({ isArchived: false })

    expect(restored.body.board.isArchived).toBe(false)

    const deleted = await api()
      .delete(`/api/boards/${fixture.boardId}`)
      .set('authorization', asUser(fixture.owner))

    expect(deleted.status).toBe(204)
    expect(await prisma.board.count({ where: { id: fixture.boardId } })).toBe(0)
  })

  it('creates a board with its creator as the owner member', async () => {
    const response = await api()
      .post('/api/boards')
      .set('authorization', asUser(fixture.outsider))
      .send({ title: 'Fresh board' })

    expect(response.status).toBe(201)
    expect(response.body.board.owner).toMatchObject({ id: fixture.outsider.id })

    const membership = await prisma.boardMember.findFirstOrThrow({
      where: { boardId: response.body.board.id },
    })

    expect(membership).toMatchObject({ userId: fixture.outsider.id, role: 'OWNER' })
  })
})

describe('board members', () => {
  it('lists members with their roles', async () => {
    const response = await api()
      .get(`/api/boards/${fixture.boardId}/members`)
      .set('authorization', asUser(fixture.viewer))

    expect(response.status).toBe(200)
    expect(sorted(response.body.members.map((entry: { role: string }) => entry.role))).toEqual([
      'MEMBER',
      'OWNER',
      'VIEWER',
    ])
  })

  it('invites by email, changes a role and removes a member', async () => {
    const invited = await api()
      .post(`/api/boards/${fixture.boardId}/members`)
      .set('authorization', asUser(fixture.owner))
      .send({ email: fixture.outsider.email, role: 'VIEWER' })

    expect(invited.status).toBe(201)
    expect(invited.body.member).toMatchObject({ role: 'VIEWER' })
    expect(invited.body.member.user).toMatchObject({ id: fixture.outsider.id })

    const promoted = await api()
      .patch(`/api/boards/${fixture.boardId}/members/${fixture.outsider.id}`)
      .set('authorization', asUser(fixture.owner))
      .send({ role: 'MEMBER' })

    expect(promoted.status).toBe(200)
    expect(promoted.body.member.role).toBe('MEMBER')

    const removed = await api()
      .delete(`/api/boards/${fixture.boardId}/members/${fixture.outsider.id}`)
      .set('authorization', asUser(fixture.owner))

    expect(removed.status).toBe(204)
    expect(
      await prisma.boardMember.count({
        where: { boardId: fixture.boardId, userId: fixture.outsider.id },
      }),
    ).toBe(0)
  })

  it('refuses to invite an unknown email or an existing member', async () => {
    const unknown = await api()
      .post(`/api/boards/${fixture.boardId}/members`)
      .set('authorization', asUser(fixture.owner))
      .send({ email: 'nobody@kanban.test' })
    const duplicate = await api()
      .post(`/api/boards/${fixture.boardId}/members`)
      .set('authorization', asUser(fixture.owner))
      .send({ email: fixture.member.email })

    expect(unknown.status).toBe(404)
    expect(duplicate.status).toBe(409)
    expect(duplicate.body.error.message).toContain('already a member')
  })

  it('refuses to change or remove the owner membership', async () => {
    const roleChange = await api()
      .patch(`/api/boards/${fixture.boardId}/members/${fixture.owner.id}`)
      .set('authorization', asUser(fixture.owner))
      .send({ role: 'MEMBER' })
    const removal = await api()
      .delete(`/api/boards/${fixture.boardId}/members/${fixture.owner.id}`)
      .set('authorization', asUser(fixture.owner))

    expect(roleChange.status).toBe(409)
    expect(removal.status).toBe(409)
    expect(removal.body.error.message).toContain('transfer ownership')
  })

  it('refuses to assign the OWNER role through the member endpoints', async () => {
    const response = await api()
      .post(`/api/boards/${fixture.boardId}/members`)
      .set('authorization', asUser(fixture.owner))
      .send({ email: fixture.outsider.email, role: 'OWNER' })

    expect(response.status).toBe(422)
  })
})

describe('share link and guest access', () => {
  async function createShareLink() {
    return api()
      .post(`/api/boards/${fixture.boardId}/share-link`)
      .set('authorization', asUser(fixture.owner))
      .send({})
  }

  it('creates, reads and revokes a link', async () => {
    const created = await createShareLink()

    expect(created.status).toBe(201)
    expect(typeof created.body.shareLink.token).toBe('string')

    const read = await api()
      .get(`/api/boards/${fixture.boardId}/share-link`)
      .set('authorization', asUser(fixture.owner))

    expect(read.status).toBe(200)
    expect(read.body.shareLink.token).toBe(created.body.shareLink.token)

    const revoked = await api()
      .delete(`/api/boards/${fixture.boardId}/share-link`)
      .set('authorization', asUser(fixture.owner))

    expect(revoked.status).toBe(204)

    const afterRevoke = await api().get(`/api/public/boards/${created.body.shareLink.token}`)

    expect(afterRevoke.status).toBe(404)
  })

  it('serves a read-only board to an unauthenticated guest', async () => {
    const created = await createShareLink()
    const response = await api().get(`/api/public/boards/${created.body.shareLink.token}`)

    expect(response.status).toBe(200)
    expect(response.body.access).toBe('guest')
    expect(response.body.board.title).toBe('Roadmap')
    expect(response.body.board.columns[0].cards[0].title).toBe('Existing card')
  })

  it('refuses an unknown or expired token', async () => {
    const unknown = await api().get(`/api/public/boards/${'z'.repeat(32)}`)

    expect(unknown.status).toBe(404)

    const created = await createShareLink()
    await prisma.boardShareLink.updateMany({
      where: { boardId: fixture.boardId },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    })

    const expired = await api().get(`/api/public/boards/${created.body.shareLink.token}`)

    expect(expired.status).toBe(404)
    expect(expired.body.error.message).toContain('expired')
  })

  it('rejects a malformed token with 422', async () => {
    expect((await api().get('/api/public/boards/short')).status).toBe(422)
  })
})

describe('admin endpoints', () => {
  it('lists every board for an admin and nobody else', async () => {
    const forAdmin = await api()
      .get('/api/admin/boards')
      .set('authorization', asUser(fixture.admin))
    const forOwner = await api()
      .get('/api/admin/boards')
      .set('authorization', asUser(fixture.owner))

    expect(forAdmin.status).toBe(200)
    expect(forAdmin.body.boards.map((board: { title: string }) => board.title)).toEqual(['Roadmap'])
    expect(forOwner.status).toBe(403)
  })

  it('transfers ownership and demotes the previous owner to member', async () => {
    const response = await api()
      .post(`/api/admin/boards/${fixture.boardId}/transfer-ownership`)
      .set('authorization', asUser(fixture.admin))
      .send({ newOwnerId: fixture.member.id })

    expect(response.status).toBe(200)
    expect(response.body.board.owner).toMatchObject({ id: fixture.member.id })

    const memberships = await prisma.boardMember.findMany({
      where: { boardId: fixture.boardId },
      select: { userId: true, role: true },
    })
    const roleOf = (userId: string) =>
      memberships.find((membership) => membership.userId === userId)?.role

    expect(roleOf(fixture.member.id)).toBe('OWNER')
    expect(roleOf(fixture.owner.id)).toBe('MEMBER')
  })

  it('refuses an unknown board, an unknown user and the current owner', async () => {
    const unknownBoard = await api()
      .post('/api/admin/boards/00000000-0000-4000-8000-000000000000/transfer-ownership')
      .set('authorization', asUser(fixture.admin))
      .send({ newOwnerId: fixture.member.id })
    const unknownUser = await api()
      .post(`/api/admin/boards/${fixture.boardId}/transfer-ownership`)
      .set('authorization', asUser(fixture.admin))
      .send({ newOwnerId: '00000000-0000-4000-8000-000000000000' })
    const sameOwner = await api()
      .post(`/api/admin/boards/${fixture.boardId}/transfer-ownership`)
      .set('authorization', asUser(fixture.admin))
      .send({ newOwnerId: fixture.owner.id })

    expect(unknownBoard.status).toBe(404)
    expect(unknownUser.status).toBe(404)
    expect(sameOwner.status).toBe(409)
  })
})

describe('the role matrix from section 7', () => {
  type Caller = 'viewer' | 'member' | 'owner' | 'admin'

  function callerToken(caller: Caller) {
    return asUser(fixture[caller])
  }

  const actions: {
    action: string
    allowed: Caller[]
    perform: (token: string) => Promise<Response>
  }[] = [
    {
      action: 'view the board tree',
      allowed: ['viewer', 'member', 'owner', 'admin'],
      perform: (token) => api().get(`/api/boards/${fixture.boardId}`).set('authorization', token),
    },
    {
      action: 'read comments',
      allowed: ['viewer', 'member', 'owner', 'admin'],
      perform: (token) =>
        api().get(`/api/cards/${fixture.cardId}/comments`).set('authorization', token),
    },
    {
      action: 'create a card',
      allowed: ['member', 'owner'],
      perform: (token) =>
        api()
          .post(`/api/columns/${fixture.columnId}/cards`)
          .set('authorization', token)
          .send({ title: 'Matrix card' }),
    },
    {
      action: 'edit a card',
      allowed: ['member', 'owner'],
      perform: (token) =>
        api()
          .patch(`/api/cards/${fixture.cardId}`)
          .set('authorization', token)
          .send({ title: 'Matrix title' }),
    },
    {
      action: 'move a card',
      allowed: ['member', 'owner'],
      perform: (token) =>
        api()
          .post(`/api/cards/${fixture.cardId}/move`)
          .set('authorization', token)
          .send({ targetColumnId: fixture.columnId }),
    },
    {
      action: 'comment on a card',
      allowed: ['member', 'owner'],
      perform: (token) =>
        api()
          .post(`/api/cards/${fixture.cardId}/comments`)
          .set('authorization', token)
          .send({ body: 'Matrix comment' }),
    },
    {
      action: 'add a checklist item',
      allowed: ['member', 'owner'],
      perform: (token) =>
        api()
          .post(`/api/cards/${fixture.cardId}/checklist`)
          .set('authorization', token)
          .send({ text: 'Matrix item' }),
    },
    {
      action: 'create a board label',
      allowed: ['member', 'owner'],
      perform: (token) =>
        api()
          .post(`/api/boards/${fixture.boardId}/labels`)
          .set('authorization', token)
          .send({ name: `Matrix ${Math.random()}` }),
    },
    {
      action: 'assign labels to a card',
      allowed: ['member', 'owner'],
      perform: (token) =>
        api()
          .put(`/api/cards/${fixture.cardId}/labels`)
          .set('authorization', token)
          .send({ labelIds: [fixture.labelId] }),
    },
    {
      action: 'create a column',
      allowed: ['owner'],
      perform: (token) =>
        api()
          .post(`/api/boards/${fixture.boardId}/columns`)
          .set('authorization', token)
          .send({ title: 'Matrix column' }),
    },
    {
      action: 'set a column wip limit',
      allowed: ['owner'],
      perform: (token) =>
        api()
          .patch(`/api/columns/${fixture.columnId}`)
          .set('authorization', token)
          .send({ wipLimit: 5 }),
    },
    {
      action: 'reorder a column',
      allowed: ['owner'],
      perform: (token) =>
        api().post(`/api/columns/${fixture.columnId}/move`).set('authorization', token).send({}),
    },
    {
      action: 'invite a member',
      allowed: ['owner'],
      perform: (token) =>
        api()
          .post(`/api/boards/${fixture.boardId}/members`)
          .set('authorization', token)
          .send({ email: fixture.outsider.email }),
    },
    {
      action: 'create a share link',
      allowed: ['owner'],
      perform: (token) =>
        api()
          .post(`/api/boards/${fixture.boardId}/share-link`)
          .set('authorization', token)
          .send({}),
    },
    {
      action: 'archive the board',
      allowed: ['owner'],
      perform: (token) =>
        api()
          .patch(`/api/boards/${fixture.boardId}/archive`)
          .set('authorization', token)
          .send({ isArchived: true }),
    },
    {
      action: 'update the board',
      allowed: ['owner'],
      perform: (token) =>
        api()
          .patch(`/api/boards/${fixture.boardId}`)
          .set('authorization', token)
          .send({ title: 'Matrix board' }),
    },
  ]

  for (const { action, allowed, perform } of actions) {
    for (const caller of ['viewer', 'member', 'owner', 'admin'] as Caller[]) {
      const expectation = allowed.includes(caller) ? 'allows' : 'denies'

      it(`${expectation} ${caller} to ${action}`, async () => {
        const response = await perform(callerToken(caller))

        if (allowed.includes(caller)) {
          expect(response.status).not.toBe(403)
        } else {
          expect(response.status).toBe(403)
        }
      })
    }
  }
})
