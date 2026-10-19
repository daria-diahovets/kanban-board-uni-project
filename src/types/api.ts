export type SystemRole = 'USER' | 'ADMIN'
export type BoardRole = 'OWNER' | 'MEMBER' | 'VIEWER'
export type LabelColor = 'BLACK' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO'
export type DueFilter = 'overdue' | 'today' | 'week' | 'none'

export type UserRef = {
  id: string
  email: string
  fullName: string
}

export type NamedUserRef = {
  id: string
  fullName: string
}

export type AuthenticatedUser = {
  id: string
  email: string
  fullName: string
  systemRole: SystemRole
  createdAt: string
}

export type AuthResponse = {
  user: AuthenticatedUser
  token: string
}

export type Label = {
  id: string
  name: string
  colorToken: LabelColor
}

export type BoardLabel = Label & {
  boardId: string
  createdAt: string
  _count: { cards: number }
}

export type CardCounts = {
  comments: number
  attachments: number
  checklistItems: number
}

export type BoardCard = {
  id: string
  columnId: string
  title: string
  description: string | null
  dueDate: string | null
  position: string
  isArchived: boolean
  version: number
  createdAt: string
  updatedAt: string
  labels: Label[]
  assignees: UserRef[]
  _count: CardCounts
}

export type CardDetail = BoardCard & {
  createdBy: NamedUserRef
}

export type MovedCard = {
  id: string
  columnId: string
  title: string
  position: string
  isArchived: boolean
  version: number
  updatedAt: string
}

export type BoardColumn = {
  id: string
  title: string
  position: string
  wipLimit: number | null
  createdAt: string
  activeCardCount: number
  cards: BoardCard[]
}

export type ColumnSummary = {
  id: string
  boardId: string
  title: string
  position: string
  wipLimit: number | null
  createdAt: string
  updatedAt: string
  _count: { cards: number }
}

export type MovedColumn = {
  id: string
  boardId: string
  title: string
  position: string
  wipLimit: number | null
  updatedAt: string
}

export type BoardSummary = {
  id: string
  title: string
  description: string | null
  isArchived: boolean
  createdAt: string
  updatedAt: string
  owner: UserRef
  _count: { members: number; columns: number }
}

export type BoardMembership = {
  role: BoardRole
  joinedAt: string
  user: UserRef
}

export type BoardMemberEntry = BoardMembership & {
  invitedBy: NamedUserRef | null
}

export type BoardDetail = {
  id: string
  title: string
  description: string | null
  isArchived: boolean
  createdAt: string
  updatedAt: string
  owner: UserRef
  members: BoardMembership[]
  labels: Label[]
  columns: BoardColumn[]
}

export type BoardFilters = {
  assigneeId?: string
  labelId?: string
  due?: DueFilter
  q?: string
  includeArchived?: boolean
}

export type Comment = {
  id: string
  cardId: string
  body: string
  createdAt: string
  updatedAt: string
  author: UserRef
}

export type ChecklistItem = {
  id: string
  cardId: string
  text: string
  isDone: boolean
  position: string
  createdAt: string
}

export type Attachment = {
  id: string
  cardId: string
  fileName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
  uploadedBy: UserRef
}

export type ShareLink = {
  token: string
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  createdBy: NamedUserRef
}

export type PublicBoardCard = {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  position: string
  labels: Label[]
  assignees: NamedUserRef[]
  _count: CardCounts
}

export type PublicBoard = {
  id: string
  title: string
  description: string | null
  isArchived: boolean
  updatedAt: string
  owner: { fullName: string }
  labels: Label[]
  columns: {
    id: string
    title: string
    position: string
    wipLimit: number | null
    cards: PublicBoardCard[]
  }[]
}

export type BoardDetailResponse = {
  board: BoardDetail
  viewerRole: BoardRole
  filters: BoardFilters
}

export type PublicBoardResponse = {
  board: PublicBoard
  access: 'guest'
}
