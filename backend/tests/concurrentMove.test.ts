import { describe, expect, it } from 'vitest'
import { prisma } from '../src/config/prisma'
import { api, bearer } from './helpers/api'
import { at, sorted } from './helpers/items'
import {
  createBoardWithColumns,
  createCard,
  createCards,
  createColumn,
  createUser,
} from './helpers/factories'

const CANONICAL_ORDER = [
  { position: 'asc' as const },
  { createdAt: 'asc' as const },
  { id: 'asc' as const },
]

type MoveBody = {
  targetColumnId: string
  prevCardId?: string | null
  nextCardId?: string | null
}

function moveCard(token: string, cardId: string, body: MoveBody) {
  return api().post(`/api/cards/${cardId}/move`).set('authorization', bearer(token)).send(body)
}

async function orderedCards(columnId: string) {
  const cards = await prisma.card.findMany({
    where: { columnId },
    orderBy: CANONICAL_ORDER,
    select: { id: true, title: true, position: true },
  })

  return cards.map((card) => ({ ...card, position: card.position.toNumber() }))
}

function isStrictlyAscending(values: number[]) {
  return values.every((value, index) => index === 0 || at(values, index - 1) < value)
}

function smallestGap(values: number[]) {
  return Math.min(...values.slice(1).map((value, index) => value - at(values, index)))
}

describe('POST /api/cards/:cardId/move under concurrency', () => {
  it('keeps the order consistent when two cards are dropped into the same slot', async () => {
    const owner = await createUser()
    const { columns } = await createBoardWithColumns(owner.id, ['Todo'])
    const column = at(columns, 0)
    const cards = await createCards(column.id, owner.id, ['A', 'B', 'C', 'D'])
    const anchorPrevious = at(cards, 0)
    const anchorNext = at(cards, 1)
    const slot = {
      targetColumnId: column.id,
      prevCardId: anchorPrevious.id,
      nextCardId: anchorNext.id,
    }

    const responses = await Promise.all([
      moveCard(owner.token, at(cards, 2).id, slot),
      moveCard(owner.token, at(cards, 3).id, slot),
    ])

    expect(responses.map((response) => response.status)).toEqual([200, 200])

    const resulting = await orderedCards(column.id)
    const positions = resulting.map((card) => card.position)
    const titles = resulting.map((card) => card.title)

    expect(resulting).toHaveLength(4)
    expect(new Set(positions).size).toBe(4)
    expect(isStrictlyAscending(positions)).toBe(true)
    expect(titles[0]).toBe('A')
    expect(titles[3]).toBe('B')
    expect(sorted(titles.slice(1, 3))).toEqual(['C', 'D'])
  })

  it('accepts eight writers racing into the same slot over several rounds', async () => {
    const writers = 8
    const rounds = 3
    const owner = await createUser()
    const { columns } = await createBoardWithColumns(owner.id, ['Todo'])
    const column = at(columns, 0)
    const anchors = await createCards(column.id, owner.id, ['LEFT', 'RIGHT'])
    const moverTitles = Array.from({ length: writers }, (_, index) => `W${index}`)
    const movers = await createCards(column.id, owner.id, moverTitles)
    const slot = {
      targetColumnId: column.id,
      prevCardId: at(anchors, 0).id,
      nextCardId: at(anchors, 1).id,
    }

    for (let round = 1; round <= rounds; round++) {
      const responses = await Promise.all(
        movers.map((mover) => moveCard(owner.token, mover.id, slot)),
      )

      expect(responses.map((response) => response.status)).toEqual(Array(writers).fill(200))

      const resulting = await orderedCards(column.id)
      const positions = resulting.map((card) => card.position)
      const titles = resulting.map((card) => card.title)

      expect(resulting).toHaveLength(writers + 2)
      expect(new Set(positions).size).toBe(writers + 2)
      expect(isStrictlyAscending(positions)).toBe(true)
      expect(titles[0]).toBe('LEFT')
      expect(titles[writers + 1]).toBe('RIGHT')
      expect(sorted(titles.slice(1, writers + 1))).toEqual(sorted(moverTitles))
    }
  })

  it('collects cards arriving from several columns at once', async () => {
    const owner = await createUser()
    const { board, columns } = await createBoardWithColumns(owner.id, ['Backlog', 'Doing'])
    const target = await createColumn(board.id, { title: 'Done' })
    const sources = [at(columns, 0), at(columns, 1)]
    const incoming = []

    for (const source of sources) {
      incoming.push(
        ...(await createCards(source.id, owner.id, [
          `${source.title} 1`,
          `${source.title} 2`,
          `${source.title} 3`,
        ])),
      )
    }

    const responses = await Promise.all(
      incoming.map((card) =>
        moveCard(owner.token, card.id, {
          targetColumnId: target.id,
          prevCardId: null,
          nextCardId: null,
        }),
      ),
    )

    expect(responses.map((response) => response.status)).toEqual(Array(incoming.length).fill(200))

    const resulting = await orderedCards(target.id)
    const positions = resulting.map((card) => card.position)

    expect(resulting).toHaveLength(incoming.length)
    expect(new Set(positions).size).toBe(incoming.length)
    expect(isStrictlyAscending(positions)).toBe(true)
    expect(sorted(resulting.map((card) => card.title))).toEqual(
      sorted(incoming.map((card) => card.title)),
    )

    for (const source of sources) {
      expect(await prisma.card.count({ where: { columnId: source.id } })).toBe(0)
    }
  })

  it('lets exactly one of two racing moves through a wip limit of one', async () => {
    const owner = await createUser()
    const { board, columns } = await createBoardWithColumns(owner.id, ['Todo'])
    const source = at(columns, 0)
    const target = await createColumn(board.id, { title: 'Doing', wipLimit: 1 })
    const cards = await createCards(source.id, owner.id, ['First', 'Second'])

    const responses = await Promise.all(
      cards.map((card) =>
        moveCard(owner.token, card.id, {
          targetColumnId: target.id,
          prevCardId: null,
          nextCardId: null,
        }),
      ),
    )

    expect(sorted(responses.map((response) => response.status))).toEqual([200, 409])
    expect(await prisma.card.count({ where: { columnId: target.id } })).toBe(1)
    expect(await prisma.card.count({ where: { columnId: source.id } })).toBe(1)

    const rejected = responses.find((response) => response.status === 409)

    expect(rejected?.body.error.code).toBe('CONFLICT')
  })

  it('rebalances the column once the gap between neighbours collapses', async () => {
    const insertions = 35
    const owner = await createUser()
    const { columns } = await createBoardWithColumns(owner.id, ['Todo'])
    const column = at(columns, 0)
    const anchors = await createCards(column.id, owner.id, ['LEFT', 'RIGHT'])
    const anchorPrevious = at(anchors, 0)

    let previousGap = Number.POSITIVE_INFINITY
    let rebalancedAt: number | null = null

    for (let insertion = 1; insertion <= insertions; insertion++) {
      const card = await createCard(column.id, owner.id, { title: `C${insertion}` })
      const response = await moveCard(owner.token, card.id, {
        targetColumnId: column.id,
        prevCardId: anchorPrevious.id,
      })

      expect(response.status).toBe(200)

      const resulting = await orderedCards(column.id)
      const positions = resulting.map((entry) => entry.position)

      expect(new Set(positions).size).toBe(positions.length)
      expect(isStrictlyAscending(positions)).toBe(true)
      expect(at(resulting, 0).title).toBe('LEFT')
      expect(at(resulting, resulting.length - 1).title).toBe('RIGHT')

      const gap = smallestGap(positions)

      if (rebalancedAt === null && gap > previousGap * 10) {
        rebalancedAt = insertion
      }

      previousGap = gap
    }

    expect(rebalancedAt).not.toBeNull()
    expect(await prisma.card.count({ where: { columnId: column.id } })).toBe(insertions + 2)
  })
})
