import 'dotenv/config'
import { writeFile } from 'node:fs/promises'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import type { BoardRole, LabelColor } from '@prisma/client'
import bcrypt from 'bcrypt'
import { ensureUploadDirectory, storedFilePath } from '../src/config/storage'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

const SEED_PASSWORD = 'Password123!'
const BCRYPT_ROUNDS = 10
const POSITION_STEP = 1024
const INSERT_CHUNK = 500

const VOLUME = {
  users: 60,
  boards: 30,
  columns: 120,
  cards: 800,
  comments: 1500,
}

const COLUMNS_PER_BOARD = 4
const LABELS_PER_BOARD = 4

const userId = {
  admin: '11111111-1111-4111-8111-111111111111',
  owner: '22222222-2222-4222-8222-222222222222',
  member: '33333333-3333-4333-8333-333333333333',
}

const knownBoardId = '44444444-4444-4444-8444-444444444444'

const knownColumnId = {
  backlog: '55555555-5555-4555-8555-555555555551',
  inProgress: '55555555-5555-4555-8555-555555555552',
  review: '55555555-5555-4555-8555-555555555554',
  done: '55555555-5555-4555-8555-555555555553',
}

const FIRST_NAMES = [
  'Ada',
  'Bruno',
  'Carla',
  'Diego',
  'Elena',
  'Felix',
  'Greta',
  'Hugo',
  'Iris',
  'Jonas',
  'Karin',
  'Lukas',
]

const LAST_NAMES = [
  'Novak',
  'Fischer',
  'Moreau',
  'Silva',
  'Keller',
  'Barnes',
  'Lindqvist',
  'Okafor',
  'Varga',
  'Petrov',
]

const PROJECT_NAMES = [
  'Mobile App',
  'Billing Platform',
  'Design System',
  'Data Warehouse',
  'Customer Portal',
  'Internal Tooling',
  'Marketing Site',
  'Support Desk',
  'Payments API',
  'Onboarding Flow',
]

const PROJECT_PHASES = ['Discovery', 'Delivery', 'Hardening']

const COLUMN_TITLES = ['Backlog', 'In Progress', 'Review', 'Done']
const COLUMN_LIMITS: (number | null)[] = [null, 12, 6, null]

const LABEL_SPECS: { name: string; colorToken: LabelColor }[] = [
  { name: 'Bug', colorToken: 'ERROR' },
  { name: 'Feature', colorToken: 'SUCCESS' },
  { name: 'Urgent', colorToken: 'WARNING' },
  { name: 'Documentation', colorToken: 'BLACK' },
]

const CARD_VERBS = [
  'Audit',
  'Rewrite',
  'Measure',
  'Document',
  'Automate',
  'Refactor',
  'Review',
  'Prototype',
]

const CARD_SUBJECTS = [
  'the onboarding emails',
  'the export pipeline',
  'the invoice totals',
  'the search ranking',
  'the retry policy',
  'the audit trail',
  'the signup funnel',
  'the cache layer',
  'the error pages',
  'the release checklist',
]

const CARD_DESCRIPTIONS = [
  'Collect the current numbers first so the change can be compared against them.',
  'Split the work so a single pull request stays reviewable.',
  'Write down the decision in the team notes once this lands.',
]

const COMMENT_BODIES = [
  'Picked this up, the first half is straightforward.',
  'Blocked on the staging credentials, asked in the channel.',
  'Reproduced it, the fix is smaller than the ticket suggests.',
  'Moved the deadline out by a day after the review.',
  'Numbers look right now, leaving it for a second pair of eyes.',
]

const CHECKLIST_STEPS = ['Draft the approach', 'Implement', 'Write the summary']

const DUE_DATE_OFFSETS: (number | null)[] = [-3, 0, 2, 20, null]

const positionAt = (index: number) => (index + 1) * POSITION_STEP

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000)

function pick<Item>(items: Item[], index: number): Item {
  return items[index % items.length] as Item
}

function seedId(prefix: string, index: number) {
  return `${prefix}-0000-4000-8000-${index.toString(16).padStart(12, '0')}`
}

async function insertMany<Row>(rows: Row[], insert: (chunk: Row[]) => Promise<unknown>) {
  for (let start = 0; start < rows.length; start += INSERT_CHUNK) {
    await insert(rows.slice(start, start + INSERT_CHUNK))
  }
}

async function clearDatabase() {
  await prisma.board.deleteMany()
  await prisma.user.deleteMany()
}

async function createUsers() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS)

  const known = [
    {
      id: userId.admin,
      email: 'admin@kanban.test',
      passwordHash,
      fullName: 'Alex Administrator',
      systemRole: 'ADMIN' as const,
    },
    {
      id: userId.owner,
      email: 'owner@kanban.test',
      passwordHash,
      fullName: 'Olivia Owner',
      systemRole: 'USER' as const,
    },
    {
      id: userId.member,
      email: 'member@kanban.test',
      passwordHash,
      fullName: 'Marcus Member',
      systemRole: 'USER' as const,
    },
  ]

  const generated = Array.from({ length: VOLUME.users - known.length }, (_unused, index) => {
    const firstName = pick(FIRST_NAMES, index)
    const lastName = pick(LAST_NAMES, Math.floor(index / FIRST_NAMES.length))
    const number = String(index + 1).padStart(2, '0')

    return {
      id: seedId('0a000001', index),
      email: `user${number}@kanban.test`,
      passwordHash,
      fullName: `${firstName} ${lastName}`,
      systemRole: 'USER' as const,
    }
  })

  await insertMany([...known, ...generated], (data) => prisma.user.createMany({ data }))

  return generated.map((user) => user.id)
}

async function createKnownBoard() {
  await prisma.board.create({
    data: {
      id: knownBoardId,
      title: 'Website Redesign',
      description: 'Rebuild the marketing site with the new design system',
      ownerId: userId.owner,
      members: {
        create: [
          { userId: userId.owner, role: 'OWNER' },
          { userId: userId.member, role: 'MEMBER', invitedById: userId.owner },
        ],
      },
      columns: {
        create: [
          { id: knownColumnId.backlog, title: 'Backlog', position: positionAt(0) },
          {
            id: knownColumnId.inProgress,
            title: 'In Progress',
            position: positionAt(1),
            wipLimit: 3,
          },
          { id: knownColumnId.review, title: 'Review', position: positionAt(2), wipLimit: 2 },
          { id: knownColumnId.done, title: 'Done', position: positionAt(3) },
        ],
      },
      labels: { create: LABEL_SPECS },
    },
  })

  const labels = await prisma.label.findMany({ where: { boardId: knownBoardId } })
  const labelByName = new Map(labels.map((label) => [label.name, label.id]))
  const bugLabelId = labelByName.get('Bug')
  const featureLabelId = labelByName.get('Feature')
  const urgentLabelId = labelByName.get('Urgent')

  if (!bugLabelId || !featureLabelId || !urgentLabelId) {
    throw new Error('Seed labels were not created for the known board')
  }

  await prisma.card.create({
    data: {
      columnId: knownColumnId.backlog,
      title: 'Audit current page templates',
      description: 'List every template that needs to be migrated to the new tokens',
      position: positionAt(0),
      createdById: userId.owner,
      dueDate: daysFromNow(10),
      labels: { create: [{ labelId: featureLabelId }] },
    },
  })

  await prisma.card.create({
    data: {
      columnId: knownColumnId.backlog,
      title: 'Collect accessibility requirements',
      position: positionAt(1),
      createdById: userId.owner,
      assignees: { create: [{ userId: userId.member }] },
    },
  })

  await prisma.card.create({
    data: {
      columnId: knownColumnId.backlog,
      title: 'Write migration plan for legacy styles',
      position: positionAt(2),
      createdById: userId.member,
    },
  })

  await prisma.card.create({
    data: {
      columnId: knownColumnId.inProgress,
      title: 'Build the design token layer',
      description: 'Transcribe every value from the design system into CSS variables',
      position: positionAt(0),
      createdById: userId.owner,
      dueDate: daysFromNow(3),
      assignees: {
        create: [{ userId: userId.owner }, { userId: userId.member }],
      },
      labels: { create: [{ labelId: featureLabelId }, { labelId: urgentLabelId }] },
      checklistItems: {
        create: [
          { text: 'Colors', isDone: true, position: positionAt(0) },
          { text: 'Typography', isDone: true, position: positionAt(1) },
          { text: 'Spacing scale', isDone: false, position: positionAt(2) },
          { text: 'Border weights', isDone: false, position: positionAt(3) },
        ],
      },
      comments: {
        create: [
          {
            authorId: userId.member,
            body: 'Spacing is intentionally irregular in the spec, should we keep it that way?',
          },
          {
            authorId: userId.owner,
            body: 'Yes, keep the scale as written and break it only in layout code.',
          },
        ],
      },
    },
  })

  await prisma.card.create({
    data: {
      columnId: knownColumnId.inProgress,
      title: 'Fix overflowing card titles on narrow lanes',
      position: positionAt(1),
      createdById: userId.member,
      dueDate: daysFromNow(-2),
      assignees: { create: [{ userId: userId.member }] },
      labels: { create: [{ labelId: bugLabelId }, { labelId: urgentLabelId }] },
      comments: {
        create: [
          {
            authorId: userId.owner,
            body: 'Reproduced at 320px, the title pushes the label row out of the tile.',
          },
        ],
      },
    },
  })

  await prisma.card.create({
    data: {
      columnId: knownColumnId.done,
      title: 'Set up the project repository',
      position: positionAt(0),
      createdById: userId.owner,
      assignees: { create: [{ userId: userId.owner }] },
    },
  })

  await prisma.card.create({
    data: {
      columnId: knownColumnId.done,
      title: 'Configure linting and formatting',
      description: 'One ESLint and one Prettier setup covering both halves of the repository',
      position: positionAt(1),
      createdById: userId.owner,
      assignees: { create: [{ userId: userId.owner }] },
      comments: {
        create: [{ authorId: userId.member, body: 'Pre-commit hook works, nice.' }],
      },
    },
  })
}

type GeneratedBoard = {
  id: string
  ownerId: string
  memberIds: string[]
  columnIds: string[]
  labelIds: string[]
}

async function createGeneratedBoards(generatedUserIds: string[]) {
  const boardCount = VOLUME.boards - 1
  const boards: GeneratedBoard[] = []
  const memberRows: {
    id: string
    boardId: string
    userId: string
    role: BoardRole
    invitedById: string | null
  }[] = []
  const columnRows: {
    id: string
    boardId: string
    title: string
    position: number
    wipLimit: number | null
  }[] = []
  const labelRows: { id: string; boardId: string; name: string; colorToken: LabelColor }[] = []

  const boardRows = Array.from({ length: boardCount }, (_unused, index) => {
    const boardId = seedId('0b000001', index)
    const ownerId = pick(generatedUserIds, index)
    const extraMembers = 2 + (index % 3)
    const memberIds = [ownerId]

    memberRows.push({
      id: seedId('0c000001', memberRows.length),
      boardId,
      userId: ownerId,
      role: 'OWNER',
      invitedById: null,
    })

    for (let offset = 1; offset <= extraMembers; offset += 1) {
      const candidate = pick(generatedUserIds, index + offset * 7)

      if (memberIds.includes(candidate)) {
        continue
      }

      memberIds.push(candidate)
      memberRows.push({
        id: seedId('0c000001', memberRows.length),
        boardId,
        userId: candidate,
        role: offset % 2 === 0 ? 'VIEWER' : 'MEMBER',
        invitedById: ownerId,
      })
    }

    if (index % 4 === 0) {
      memberRows.push({
        id: seedId('0c000001', memberRows.length),
        boardId,
        userId: userId.member,
        role: 'MEMBER',
        invitedById: ownerId,
      })
      memberIds.push(userId.member)
    }

    const columnIds = COLUMN_TITLES.map((title, columnIndex) => {
      const columnId = seedId('0d000001', index * COLUMNS_PER_BOARD + columnIndex)

      columnRows.push({
        id: columnId,
        boardId,
        title,
        position: positionAt(columnIndex),
        wipLimit: pick(COLUMN_LIMITS, columnIndex),
      })

      return columnId
    })

    const labelIds = LABEL_SPECS.map((spec, labelIndex) => {
      const labelId = seedId('0e000001', index * LABELS_PER_BOARD + labelIndex)

      labelRows.push({ id: labelId, boardId, name: spec.name, colorToken: spec.colorToken })

      return labelId
    })

    boards.push({ id: boardId, ownerId, memberIds, columnIds, labelIds })

    return {
      id: boardId,
      title: `${pick(PROJECT_NAMES, index)} ${pick(PROJECT_PHASES, Math.floor(index / PROJECT_NAMES.length))}`,
      description:
        index % 3 === 0 ? null : `Tracked by the ${pick(PROJECT_NAMES, index).toLowerCase()} team`,
      ownerId,
      isArchived: index % 9 === 8,
    }
  })

  await insertMany(boardRows, (data) => prisma.board.createMany({ data }))
  await insertMany(memberRows, (data) => prisma.boardMember.createMany({ data }))
  await insertMany(columnRows, (data) => prisma.column.createMany({ data }))
  await insertMany(labelRows, (data) => prisma.label.createMany({ data }))

  return boards
}

type GeneratedCard = {
  id: string
  boardIndex: number
  index: number
}

async function createGeneratedCards(boards: GeneratedBoard[]) {
  const existingCards = await prisma.card.count()
  const remaining = VOLUME.cards - existingCards
  const lanes = boards.flatMap((board, boardIndex) =>
    board.columnIds.map((columnId) => ({ boardIndex, columnId })),
  )

  const cardRows: {
    id: string
    columnId: string
    title: string
    description: string | null
    dueDate: Date | null
    position: number
    createdById: string
    isArchived: boolean
  }[] = []
  const cards: GeneratedCard[] = []
  const laneFill = new Map<string, number>()

  for (let index = 0; index < remaining; index += 1) {
    const lane = pick(lanes, index)
    const board = boards[lane.boardIndex] as GeneratedBoard
    const slot = laneFill.get(lane.columnId) ?? 0
    const cardId = seedId('0f000001', index)
    const dueOffset = pick(DUE_DATE_OFFSETS, index)

    laneFill.set(lane.columnId, slot + 1)
    cards.push({ id: cardId, boardIndex: lane.boardIndex, index })
    cardRows.push({
      id: cardId,
      columnId: lane.columnId,
      title: `${pick(CARD_VERBS, index)} ${pick(CARD_SUBJECTS, Math.floor(index / CARD_VERBS.length))}`,
      description: index % 3 === 0 ? pick(CARD_DESCRIPTIONS, index) : null,
      dueDate: dueOffset === null ? null : daysFromNow(dueOffset),
      position: positionAt(slot),
      createdById: pick(board.memberIds, index),
      isArchived: index % 40 === 39,
    })
  }

  await insertMany(cardRows, (data) => prisma.card.createMany({ data }))

  return cards
}

async function createCardRelations(boards: GeneratedBoard[], cards: GeneratedCard[]) {
  const assigneeRows: { cardId: string; userId: string }[] = []
  const labelRows: { cardId: string; labelId: string }[] = []
  const checklistRows: {
    id: string
    cardId: string
    text: string
    isDone: boolean
    position: number
  }[] = []
  const attachmentRows: {
    id: string
    cardId: string
    uploadedById: string
    fileName: string
    storedName: string
    mimeType: string
    sizeBytes: number
  }[] = []

  for (const card of cards) {
    const board = boards[card.boardIndex] as GeneratedBoard

    if (card.index % 2 === 0) {
      assigneeRows.push({
        cardId: card.id,
        userId: pick(board.memberIds, card.index),
      })
    }

    if (card.index % 6 === 0 && board.memberIds.length > 1) {
      assigneeRows.push({
        cardId: card.id,
        userId: pick(board.memberIds, card.index + 1),
      })
    }

    if (card.index % 3 === 0) {
      labelRows.push({
        cardId: card.id,
        labelId: pick(board.labelIds, card.index),
      })
    }

    if (card.index % 9 === 0) {
      labelRows.push({
        cardId: card.id,
        labelId: pick(board.labelIds, card.index + 2),
      })
    }

    if (card.index % 5 === 0) {
      CHECKLIST_STEPS.forEach((text, stepIndex) => {
        checklistRows.push({
          id: seedId('10000001', checklistRows.length),
          cardId: card.id,
          text,
          isDone: stepIndex === 0,
          position: positionAt(stepIndex),
        })
      })
    }

    if (card.index % 25 === 0) {
      const storedName = `${seedId('11000001', attachmentRows.length)}.txt`
      const content = `Seeded attachment for card ${card.id}\n`

      attachmentRows.push({
        id: seedId('12000001', attachmentRows.length),
        cardId: card.id,
        uploadedById: board.ownerId,
        fileName: 'handover-notes.txt',
        storedName,
        mimeType: 'text/plain',
        sizeBytes: Buffer.byteLength(content),
      })

      await writeFile(storedFilePath(storedName), content)
    }
  }

  const deduplicatedAssignees = [
    ...new Map(assigneeRows.map((row) => [`${row.cardId}:${row.userId}`, row])).values(),
  ]
  const deduplicatedLabels = [
    ...new Map(labelRows.map((row) => [`${row.cardId}:${row.labelId}`, row])).values(),
  ]

  await insertMany(deduplicatedAssignees, (data) => prisma.cardAssignee.createMany({ data }))
  await insertMany(deduplicatedLabels, (data) => prisma.cardLabel.createMany({ data }))
  await insertMany(checklistRows, (data) => prisma.checklistItem.createMany({ data }))
  await insertMany(attachmentRows, (data) => prisma.attachment.createMany({ data }))
}

async function createComments(boards: GeneratedBoard[], cards: GeneratedCard[]) {
  const existingComments = await prisma.comment.count()
  const remaining = VOLUME.comments - existingComments
  const commentRows: { id: string; cardId: string; authorId: string; body: string }[] = []

  for (let index = 0; index < remaining; index += 1) {
    const card = pick(cards, index)
    const board = boards[card.boardIndex] as GeneratedBoard

    commentRows.push({
      id: seedId('13000001', index),
      cardId: card.id,
      authorId: pick(board.memberIds, index),
      body: pick(COMMENT_BODIES, index),
    })
  }

  await insertMany(commentRows, (data) => prisma.comment.createMany({ data }))
}

async function createShareLinks(boards: GeneratedBoard[]) {
  const shareLinkRows = boards
    .filter((_board, index) => index % 5 === 0)
    .map((board, index) => ({
      id: seedId('14000001', index),
      boardId: board.id,
      token: `seedsharetoken${String(index).padStart(8, '0')}`,
      isActive: true,
      expiresAt: index % 2 === 0 ? null : daysFromNow(30),
      createdById: board.ownerId,
    }))

  await insertMany(shareLinkRows, (data) => prisma.boardShareLink.createMany({ data }))
}

async function reportCounts() {
  const counts = {
    users: await prisma.user.count(),
    boards: await prisma.board.count(),
    boardMembers: await prisma.boardMember.count(),
    columns: await prisma.column.count(),
    cards: await prisma.card.count(),
    labels: await prisma.label.count(),
    cardLabels: await prisma.cardLabel.count(),
    cardAssignees: await prisma.cardAssignee.count(),
    checklistItems: await prisma.checklistItem.count(),
    attachments: await prisma.attachment.count(),
    comments: await prisma.comment.count(),
    shareLinks: await prisma.boardShareLink.count(),
  }

  const required: [string, number, number][] = [
    ['users', counts.users, VOLUME.users],
    ['boards', counts.boards, VOLUME.boards],
    ['columns', counts.columns, VOLUME.columns],
    ['cards', counts.cards, VOLUME.cards],
    ['comments', counts.comments, VOLUME.comments],
  ]

  const missed = required.filter(([, actual, expected]) => actual !== expected)

  if (missed.length > 0) {
    throw new Error(
      `Seed volume is wrong: ${missed
        .map(([name, actual, expected]) => `${name} ${actual} instead of ${expected}`)
        .join(', ')}`,
    )
  }

  console.log('Seed complete')
  console.table(counts)
  console.log(`All accounts use the password ${SEED_PASSWORD}`)
}

async function main() {
  ensureUploadDirectory()
  await clearDatabase()

  const generatedUserIds = await createUsers()
  await createKnownBoard()

  const boards = await createGeneratedBoards(generatedUserIds)
  const cards = await createGeneratedCards(boards)

  await createCardRelations(boards, cards)
  await createComments(boards, cards)
  await createShareLinks(boards)
  await reportCounts()
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
