export interface Post {
  id: string
  /** 后端 blog_post.id；静态模式下为空 */
  remoteId?: number
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
  /** 仅静态构建模式使用：frontmatter public: false 会从产物中剔除 */
  public?: boolean
  /** 种子文章来源路径，导出时用于回写 */
  source?: string
}

export interface Collection {
  id: string
  /** 后端 blog_collection.id；静态模式下为空 */
  remoteId?: number
  title: string
  subtitle?: string
  description?: string
  cover?: string
  runes?: string
  order?: number
}

export interface BoardMessage {
  id: string
  /** 后端 blog_message_board.id；静态模式下为空 */
  remoteId?: number
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

export interface TurnstileConfig {
  /** Cloudflare Turnstile 站点公钥；留空则跳过校验 */
  siteKey: string
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
  turnstile: TurnstileConfig
  icp?: string
}
