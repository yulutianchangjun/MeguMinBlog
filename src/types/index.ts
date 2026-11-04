export interface Post {
  id: string
  title: string
  subtitle?: string
  date: string
  updated?: string
  categories: string[]
  tags: string[]
  collections: string[]
  cover?: string
  excerpt?: string
  content: string
  pinned?: boolean
  hidden?: boolean
  draft?: boolean
  /** 种子文章来源路径，导出时用于回写 */
  source?: string
}

export interface Collection {
  id: string
  title: string
  subtitle?: string
  description?: string
  cover?: string
  runes?: string
  order?: number
}

export interface Comment {
  id: string
  postId: string
  parentId: string | null
  author: string
  authorAvatar?: string
  isAdmin: boolean
  content: string
  createdAt: number
  pinned?: boolean
}

export interface BoardMessage {
  id: string
  author: string
  content: string
  createdAt: number
  wall: BoardWall
  bgColor: string
  fontColor: string
  texture: BoardTexture
  rotation: number
  pinned?: boolean
  isAdmin?: boolean
}

export type BoardWall = 'top' | 'left' | 'right'
export type BoardTexture = 'none' | 'paper' | 'grid' | 'stars'

export interface CheckinState {
  dates: string[]
  total: number
}

export interface UvDay {
  date: string
  pv: number
  visitors: string[]
}

export interface UvStats {
  days: Record<string, UvDay>
}

export interface ContentOverlay {
  created: Post[]
  updated: Record<string, Post>
  deleted: string[]
  collectionsCreated: Collection[]
  collectionsUpdated: Record<string, Collection>
  collectionsDeleted: string[]
}

export interface SiteConfig {
  title: string
  subtitle: string
  author: {
    name: string
    enName: string
    avatar: string
    bio: string
    location: string
    socials: { label: string; icon: string; href: string }[]
  }
  admin: {
    githubLogin: string
    demoPassphrase: string
  }
  anniversaries: { label: string; date: string; note?: string; lunar?: boolean }[]
  icp?: string
  startDate: string
}
