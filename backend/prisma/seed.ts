import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

const SEED_PASSWORD = 'Password123!'
const BCRYPT_ROUNDS = 10
const POSITION_STEP = 1024

const userId = {
  admin: '11111111-1111-4111-8111-111111111111',
  owner: '22222222-2222-4222-8222-222222222222',
  member: '33333333-3333-4333-8333-333333333333',
}

const boardId = '44444444-4444-4444-8444-444444444444'

const columnId = {
  backlog: '55555555-5555-4555-8555-555555555551',
  inProgress: '55555555-5555-4555-8555-555555555552',
  done: '55555555-5555-4555-8555-555555555553',
}

const positionAt = (index: number) => (index + 1) * POSITION_STEP

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000)

async function clearDatabase() {
  await prisma.board.deleteMany()
  await prisma.user.deleteMany()
}

async function createUsers() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS)

  await prisma.user.createMany({
    data: [
      {
        id: userId.admin,
        email: 'admin@kanban.test',
        passwordHash,
        fullName: 'Alex Administrator',
        systemRole: 'ADMIN',
      },
      {
        id: userId.owner,
        email: 'owner@kanban.test',
        passwordHash,
        fullName: 'Olivia Owner',
        systemRole: 'USER',
      },
      {
        id: userId.member,
        email: 'member@kanban.test',
        passwordHash,
        fullName: 'Marcus Member',
        systemRole: 'USER',
      },
    ],
  })
}

async function createBoard() {
  await prisma.board.create({
    data: {
      id: boardId,
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
          { id: columnId.backlog, title: 'Backlog', position: positionAt(0) },
          { id: columnId.inProgress, title: 'In Progress', position: positionAt(1), wipLimit: 3 },
          { id: columnId.done, title: 'Done', position: positionAt(2) },
        ],
      },
    },
  })
}

async function createLabels() {
  await prisma.label.createMany({
    data: [
      { boardId, name: 'Bug', colorToken: 'ERROR' },
      { boardId, name: 'Feature', colorToken: 'SUCCESS' },
      { boardId, name: 'Urgent', colorToken: 'WARNING' },
      { boardId, name: 'Documentation', colorToken: 'BLACK' },
    ],
  })
}

async function createCards() {
  const labels = await prisma.label.findMany({ where: { boardId } })
  const labelByName = new Map(labels.map((label) => [label.name, label.id]))

  const bugLabelId = labelByName.get('Bug')
  const featureLabelId = labelByName.get('Feature')
  const urgentLabelId = labelByName.get('Urgent')

  if (!bugLabelId || !featureLabelId || !urgentLabelId) {
    throw new Error('Seed labels were not created')
  }

  await prisma.card.create({
    data: {
      columnId: columnId.backlog,
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
      columnId: columnId.backlog,
      title: 'Collect accessibility requirements',
      position: positionAt(1),
      createdById: userId.owner,
      assignees: { create: [{ userId: userId.member }] },
    },
  })

  await prisma.card.create({
    data: {
      columnId: columnId.backlog,
      title: 'Write migration plan for legacy styles',
      position: positionAt(2),
      createdById: userId.member,
    },
  })

  await prisma.card.create({
    data: {
      columnId: columnId.inProgress,
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
      columnId: columnId.inProgress,
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
      columnId: columnId.done,
      title: 'Set up the project repository',
      position: positionAt(0),
      createdById: userId.owner,
      assignees: { create: [{ userId: userId.owner }] },
    },
  })

  await prisma.card.create({
    data: {
      columnId: columnId.done,
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

async function main() {
  await clearDatabase()
  await createUsers()
  await createBoard()
  await createLabels()
  await createCards()

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
    comments: await prisma.comment.count(),
  }

  console.log('Seed complete')
  console.table(counts)
  console.log(`All accounts use the password ${SEED_PASSWORD}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
