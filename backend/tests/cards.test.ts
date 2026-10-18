import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/config/prisma'
import { api, bearer } from './helpers/api'
import {
  addBoardMember,
  createBoardWithColumns,
  createCard,
  createCards,
  createColumn,
  createLabel,
  createUser,
} from './helpers/factories'
import type { TestUser } from './helpers/factories'
import { at, sorted } from './helpers/items'

type Fixture = {
  owner: TestUser
  member: TestUser
  viewer: TestUser
  outsider: TestUser
  boardId: string
  todoId: string
  doingId: string
}

let fixture: Fixture

beforeEach(async () => {
  const owner = await createUser({ fullName: 'Board Owner' })
  const member = await createUser({ fullName: 'Board Member' })
  const viewer = await createUser({ fullName: 'Board Viewer' })
  const outsider = await createUser({ fullName: 'Nobody' })
  const { board, columns } = await createBoardWithColumns(owner.id, ['Todo', 'Doing'])

  await addBoardMember(board.id, member.id, 'MEMBER')
  await addBoardMember(board.id, viewer.id, 'VIEWER')

  fixture = {
    owner,
    member,
    viewer,
    outsider,
    boardId: board.id,
    todoId: at(columns, 0).id,
    doingId: at(columns, 1).id,
  }
})

function asUser(user: TestUser) {
  return bearer(user.token)
}

function daysFromNow(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)

  return date
}

async function boardTree(user: TestUser, query = '') {
  return api().get(`/api/boards/${fixture.boardId}${query}`).set('authorization', asUser(user))
}

async function cardsInTree(user: TestUser, query = '') {
  const response = await boardTree(user, query)
  const columns = response.body.board.columns as { cards: { title: string }[] }[]

  return sorted(columns.flatMap((column) => column.cards.map((card) => card.title)))
}

describe('POST /api/columns/:columnId/cards', () => {
  it('creates a card with description, due date and assignees', async () => {
    const dueDate = daysFromNow(2).toISOString()
    const response = await api()
      .post(`/api/columns/${fixture.todoId}/cards`)
      .set('authorization', asUser(fixture.member))
      .send({
        title: 'Write the report',
        description: 'Two pages, no more',
        dueDate,
        assigneeIds: [fixture.member.id, fixture.owner.id],
      })

    expect(response.status).toBe(201)
    expect(response.body.card).toMatchObject({
      title: 'Write the report',
      description: 'Two pages, no more',
      columnId: fixture.todoId,
      isArchived: false,
      version: 1,
    })
    expect(sorted(response.body.card.assignees.map((user: { id: string }) => user.id))).toEqual(
      sorted([fixture.member.id, fixture.owner.id]),
    )
    expect(response.body.card.position).toBe('1024')
  })

  it('appends each new card after the previous one', async () => {
    for (const title of ['First', 'Second', 'Third']) {
      await api()
        .post(`/api/columns/${fixture.todoId}/cards`)
        .set('authorization', asUser(fixture.member))
        .send({ title })
    }

    const cards = await prisma.card.findMany({
      where: { columnId: fixture.todoId },
      orderBy: { position: 'asc' },
      select: { title: true, position: true },
    })

    expect(cards.map((card) => card.title)).toEqual(['First', 'Second', 'Third'])
    expect(cards.map((card) => card.position.toNumber())).toEqual([1024, 2048, 3072])
  })

  it('refuses an assignee who is not a board member', async () => {
    const response = await api()
      .post(`/api/columns/${fixture.todoId}/cards`)
      .set('authorization', asUser(fixture.member))
      .send({ title: 'Nope', assigneeIds: [fixture.outsider.id] })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('BAD_REQUEST')
  })

  it('refuses to exceed the column wip limit', async () => {
    const limited = await createColumn(fixture.boardId, { title: 'Limited', wipLimit: 1 })
    await createCard(limited.id, fixture.owner.id, { title: 'Occupies the slot' })

    const response = await api()
      .post(`/api/columns/${limited.id}/cards`)
      .set('authorization', asUser(fixture.member))
      .send({ title: 'One too many' })

    expect(response.status).toBe(409)
    expect(response.body.error.message).toContain('limit of 1')
  })

  it('counts only active cards against the wip limit', async () => {
    const limited = await createColumn(fixture.boardId, { title: 'Limited', wipLimit: 1 })
    const occupant = await createCard(limited.id, fixture.owner.id, { title: 'Archived soon' })
    await prisma.card.update({ where: { id: occupant.id }, data: { isArchived: true } })

    const response = await api()
      .post(`/api/columns/${limited.id}/cards`)
      .set('authorization', asUser(fixture.member))
      .send({ title: 'Fits now' })

    expect(response.status).toBe(201)
  })

  it('rejects a viewer and an outsider', async () => {
    const asViewer = await api()
      .post(`/api/columns/${fixture.todoId}/cards`)
      .set('authorization', asUser(fixture.viewer))
      .send({ title: 'Not allowed' })
    const asOutsider = await api()
      .post(`/api/columns/${fixture.todoId}/cards`)
      .set('authorization', asUser(fixture.outsider))
      .send({ title: 'Not allowed' })

    expect(asViewer.status).toBe(403)
    expect(asOutsider.status).toBe(403)
  })
})

describe('GET PATCH DELETE /api/cards/:cardId', () => {
  it('returns a card with its relation counts', async () => {
    const card = await createCard(fixture.todoId, fixture.owner.id, { title: 'Readable' })
    const response = await api()
      .get(`/api/cards/${card.id}`)
      .set('authorization', asUser(fixture.viewer))

    expect(response.status).toBe(200)
    expect(response.body.card).toMatchObject({ id: card.id, title: 'Readable' })
    expect(response.body.card._count).toEqual({ comments: 0, attachments: 0, checklistItems: 0 })
  })

  it('answers 404 for an unknown card', async () => {
    const response = await api()
      .get('/api/cards/00000000-0000-4000-8000-000000000000')
      .set('authorization', asUser(fixture.member))

    expect(response.status).toBe(404)
  })

  it('updates fields and increments the version', async () => {
    const card = await createCard(fixture.todoId, fixture.owner.id, { title: 'Before' })
    const dueDate = daysFromNow(5).toISOString()
    const response = await api()
      .patch(`/api/cards/${card.id}`)
      .set('authorization', asUser(fixture.member))
      .send({ title: 'After', description: 'Edited', dueDate })

    expect(response.status).toBe(200)
    expect(response.body.card).toMatchObject({ title: 'After', description: 'Edited', version: 2 })
  })

  it('rejects an edit that carries a stale version', async () => {
    const card = await createCard(fixture.todoId, fixture.owner.id, { title: 'Contested' })

    const first = await api()
      .patch(`/api/cards/${card.id}`)
      .set('authorization', asUser(fixture.member))
      .send({ title: 'Won the race', version: 1 })
    const second = await api()
      .patch(`/api/cards/${card.id}`)
      .set('authorization', asUser(fixture.owner))
      .send({ title: 'Lost the race', version: 1 })

    expect(first.status).toBe(200)
    expect(second.status).toBe(409)
    expect(second.body.error.code).toBe('CONFLICT')

    const stored = await prisma.card.findUnique({ where: { id: card.id } })

    expect(stored?.title).toBe('Won the race')
  })

  it('archives a card through an update', async () => {
    const card = await createCard(fixture.todoId, fixture.owner.id, { title: 'Archive me' })
    const response = await api()
      .patch(`/api/cards/${card.id}`)
      .set('authorization', asUser(fixture.member))
      .send({ isArchived: true })

    expect(response.status).toBe(200)
    expect(response.body.card.isArchived).toBe(true)
  })

  it('deletes a card', async () => {
    const card = await createCard(fixture.todoId, fixture.owner.id, { title: 'Delete me' })
    const response = await api()
      .delete(`/api/cards/${card.id}`)
      .set('authorization', asUser(fixture.member))

    expect(response.status).toBe(204)
    expect(await prisma.card.count({ where: { id: card.id } })).toBe(0)
  })
})

describe('GET /api/boards/:boardId filters and search', () => {
  beforeEach(async () => {
    const cards = await createCards(fixture.todoId, fixture.owner.id, [
      'Overdue task',
      'Today task',
      'Week task',
      'Undated task',
    ])
    const overdue = at(cards, 0)
    const today = at(cards, 1)
    const thisWeek = at(cards, 2)
    const undated = at(cards, 3)

    await prisma.card.update({ where: { id: overdue.id }, data: { dueDate: daysFromNow(-3) } })
    await prisma.card.update({ where: { id: today.id }, data: { dueDate: new Date() } })
    await prisma.card.update({ where: { id: thisWeek.id }, data: { dueDate: daysFromNow(3) } })

    const label = await createLabel(fixture.boardId, { name: 'Urgent', colorToken: 'ERROR' })
    await prisma.cardLabel.create({ data: { cardId: overdue.id, labelId: label.id } })
    await prisma.cardAssignee.create({ data: { cardId: today.id, userId: fixture.member.id } })
    await prisma.card.update({
      where: { id: undated.id },
      data: { description: 'Mentions the keyword telescope' },
    })
  })

  it('returns every active card without filters', async () => {
    expect(await cardsInTree(fixture.viewer)).toEqual([
      'Overdue task',
      'Today task',
      'Undated task',
      'Week task',
    ])
  })

  it('filters by assignee', async () => {
    expect(await cardsInTree(fixture.viewer, `?assigneeId=${fixture.member.id}`)).toEqual([
      'Today task',
    ])
  })

  it('filters by label', async () => {
    const label = await prisma.label.findFirstOrThrow({ where: { boardId: fixture.boardId } })

    expect(await cardsInTree(fixture.viewer, `?labelId=${label.id}`)).toEqual(['Overdue task'])
  })

  it('filters by each due bucket', async () => {
    expect(await cardsInTree(fixture.viewer, '?due=overdue')).toEqual(['Overdue task'])
    expect(await cardsInTree(fixture.viewer, '?due=today')).toEqual(['Today task'])
    expect(await cardsInTree(fixture.viewer, '?due=week')).toEqual(['Today task', 'Week task'])
    expect(await cardsInTree(fixture.viewer, '?due=none')).toEqual(['Undated task'])
  })

  it('searches title and description case insensitively', async () => {
    expect(await cardsInTree(fixture.viewer, '?q=TODAY')).toEqual(['Today task'])
    expect(await cardsInTree(fixture.viewer, '?q=telescope')).toEqual(['Undated task'])
  })

  it('combines filters with and', async () => {
    expect(await cardsInTree(fixture.viewer, `?due=today&assigneeId=${fixture.member.id}`)).toEqual(
      ['Today task'],
    )
    expect(
      await cardsInTree(fixture.viewer, `?due=overdue&assigneeId=${fixture.member.id}`),
    ).toEqual([])
  })

  it('treats a blank parameter as absent and rejects an invalid one', async () => {
    expect(await cardsInTree(fixture.viewer, '?q=&due=')).toHaveLength(4)

    const invalid = await boardTree(fixture.viewer, '?due=someday')

    expect(invalid.status).toBe(422)
    expect(invalid.body.error.code).toBe('VALIDATION_FAILED')
  })

  it('hides archived cards unless asked and keeps activeCardCount unfiltered', async () => {
    const archived = await prisma.card.findFirstOrThrow({ where: { title: 'Week task' } })
    await prisma.card.update({ where: { id: archived.id }, data: { isArchived: true } })

    expect(await cardsInTree(fixture.viewer)).toEqual([
      'Overdue task',
      'Today task',
      'Undated task',
    ])
    expect(await cardsInTree(fixture.viewer, '?includeArchived=true')).toHaveLength(4)

    const filtered = await boardTree(fixture.viewer, '?due=overdue')
    const todo = filtered.body.board.columns.find(
      (column: { id: string }) => column.id === fixture.todoId,
    )

    expect(todo.cards).toHaveLength(1)
    expect(todo.activeCardCount).toBe(3)
  })

  it('keeps every column in the response even when nothing matches', async () => {
    const response = await boardTree(fixture.viewer, '?q=nothingmatchesthis')

    expect(response.body.board.columns).toHaveLength(2)
    expect(
      response.body.board.columns.every((column: { cards: [] }) => column.cards.length === 0),
    ).toBe(true)
  })
})

describe('card comments', () => {
  it('creates, lists in order, edits and deletes a comment', async () => {
    const card = await createCard(fixture.todoId, fixture.owner.id, { title: 'Discussed' })

    const first = await api()
      .post(`/api/cards/${card.id}/comments`)
      .set('authorization', asUser(fixture.member))
      .send({ body: 'First thought' })
    const second = await api()
      .post(`/api/cards/${card.id}/comments`)
      .set('authorization', asUser(fixture.owner))
      .send({ body: 'Second thought' })

    expect(first.status).toBe(201)
    expect(first.body.comment).toMatchObject({ body: 'First thought', cardId: card.id })
    expect(first.body.comment.author).toMatchObject({ id: fixture.member.id })
    expect(second.status).toBe(201)

    const listed = await api()
      .get(`/api/cards/${card.id}/comments`)
      .set('authorization', asUser(fixture.viewer))

    expect(listed.status).toBe(200)
    expect(listed.body.comments.map((comment: { body: string }) => comment.body)).toEqual([
      'First thought',
      'Second thought',
    ])

    const edited = await api()
      .patch(`/api/comments/${first.body.comment.id}`)
      .set('authorization', asUser(fixture.member))
      .send({ body: 'Edited thought' })

    expect(edited.status).toBe(200)
    expect(edited.body.comment.body).toBe('Edited thought')

    const deleted = await api()
      .delete(`/api/comments/${first.body.comment.id}`)
      .set('authorization', asUser(fixture.member))

    expect(deleted.status).toBe(204)
    expect(await prisma.comment.count({ where: { cardId: card.id } })).toBe(1)
  })

  it('lets only the author edit', async () => {
    const card = await createCard(fixture.todoId, fixture.owner.id, { title: 'Discussed' })
    const created = await api()
      .post(`/api/cards/${card.id}/comments`)
      .set('authorization', asUser(fixture.member))
      .send({ body: 'Mine' })

    const byOwner = await api()
      .patch(`/api/comments/${created.body.comment.id}`)
      .set('authorization', asUser(fixture.owner))
      .send({ body: 'Rewritten by the owner' })

    expect(byOwner.status).toBe(403)
    expect(byOwner.body.error.message).toContain('author')
  })

  it('lets the board owner delete someone else comment but not another member', async () => {
    const otherMember = await createUser({ fullName: 'Other Member' })
    await addBoardMember(fixture.boardId, otherMember.id, 'MEMBER')
    const card = await createCard(fixture.todoId, fixture.owner.id, { title: 'Discussed' })

    const created = await api()
      .post(`/api/cards/${card.id}/comments`)
      .set('authorization', asUser(fixture.member))
      .send({ body: 'Mine' })

    const byOtherMember = await api()
      .delete(`/api/comments/${created.body.comment.id}`)
      .set('authorization', asUser(otherMember))

    expect(byOtherMember.status).toBe(403)

    const byOwner = await api()
      .delete(`/api/comments/${created.body.comment.id}`)
      .set('authorization', asUser(fixture.owner))

    expect(byOwner.status).toBe(204)
  })

  it('refuses a viewer, an empty body and an unknown comment', async () => {
    const card = await createCard(fixture.todoId, fixture.owner.id, { title: 'Discussed' })

    const asViewer = await api()
      .post(`/api/cards/${card.id}/comments`)
      .set('authorization', asUser(fixture.viewer))
      .send({ body: 'Not allowed' })
    const empty = await api()
      .post(`/api/cards/${card.id}/comments`)
      .set('authorization', asUser(fixture.member))
      .send({ body: '   ' })
    const unknown = await api()
      .delete('/api/comments/00000000-0000-4000-8000-000000000000')
      .set('authorization', asUser(fixture.member))

    expect(asViewer.status).toBe(403)
    expect(empty.status).toBe(422)
    expect(unknown.status).toBe(404)
  })
})

describe('card checklist', () => {
  it('appends items with growing positions and lists them in order', async () => {
    const card = await createCard(fixture.todoId, fixture.owner.id, { title: 'Has a checklist' })

    for (const text of ['Draft it', 'Review it', 'Ship it']) {
      const created = await api()
        .post(`/api/cards/${card.id}/checklist`)
        .set('authorization', asUser(fixture.member))
        .send({ text })

      expect(created.status).toBe(201)
      expect(created.body.item).toMatchObject({ text, isDone: false, cardId: card.id })
    }

    const listed = await api()
      .get(`/api/cards/${card.id}/checklist`)
      .set('authorization', asUser(fixture.viewer))

    expect(listed.status).toBe(200)
    expect(listed.body.items.map((item: { text: string }) => item.text)).toEqual([
      'Draft it',
      'Review it',
      'Ship it',
    ])
    expect(listed.body.items.map((item: { position: string }) => item.position)).toEqual([
      '1024',
      '2048',
      '3072',
    ])
  })

  it('toggles and renames an item, then deletes it', async () => {
    const card = await createCard(fixture.todoId, fixture.owner.id, { title: 'Has a checklist' })
    const created = await api()
      .post(`/api/cards/${card.id}/checklist`)
      .set('authorization', asUser(fixture.member))
      .send({ text: 'Draft it' })
    const itemId = created.body.item.id as string

    const toggled = await api()
      .patch(`/api/checklist/${itemId}`)
      .set('authorization', asUser(fixture.member))
      .send({ isDone: true })

    expect(toggled.status).toBe(200)
    expect(toggled.body.item).toMatchObject({ text: 'Draft it', isDone: true })

    const renamed = await api()
      .patch(`/api/checklist/${itemId}`)
      .set('authorization', asUser(fixture.owner))
      .send({ text: 'Draft it properly' })

    expect(renamed.status).toBe(200)
    expect(renamed.body.item).toMatchObject({ text: 'Draft it properly', isDone: true })

    const deleted = await api()
      .delete(`/api/checklist/${itemId}`)
      .set('authorization', asUser(fixture.member))

    expect(deleted.status).toBe(204)
    expect(await prisma.checklistItem.count({ where: { cardId: card.id } })).toBe(0)
  })

  it('creates an item that is already done when asked', async () => {
    const card = await createCard(fixture.todoId, fixture.owner.id, { title: 'Has a checklist' })
    const created = await api()
      .post(`/api/cards/${card.id}/checklist`)
      .set('authorization', asUser(fixture.member))
      .send({ text: 'Already handled', isDone: true })

    expect(created.status).toBe(201)
    expect(created.body.item.isDone).toBe(true)
  })

  it('refuses a viewer, an empty text, an empty update and an unknown item', async () => {
    const card = await createCard(fixture.todoId, fixture.owner.id, { title: 'Has a checklist' })
    const created = await api()
      .post(`/api/cards/${card.id}/checklist`)
      .set('authorization', asUser(fixture.member))
      .send({ text: 'Draft it' })

    const asViewer = await api()
      .post(`/api/cards/${card.id}/checklist`)
      .set('authorization', asUser(fixture.viewer))
      .send({ text: 'Not allowed' })
    const empty = await api()
      .post(`/api/cards/${card.id}/checklist`)
      .set('authorization', asUser(fixture.member))
      .send({ text: '  ' })
    const nothingToUpdate = await api()
      .patch(`/api/checklist/${created.body.item.id}`)
      .set('authorization', asUser(fixture.member))
      .send({})
    const unknown = await api()
      .delete('/api/checklist/00000000-0000-4000-8000-000000000000')
      .set('authorization', asUser(fixture.member))

    expect(asViewer.status).toBe(403)
    expect(empty.status).toBe(422)
    expect(nothingToUpdate.status).toBe(422)
    expect(unknown.status).toBe(404)
  })
})
