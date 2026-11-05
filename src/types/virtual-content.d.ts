declare module 'virtual:content' {
  export interface RawPostFile {
    /** 仓库内路径，例如 /content/posts/why-once-a-day.md */
    path: string
    raw: string
  }

  export interface RawCollection {
    id: string
    title: string
    subtitle?: string
    description?: string
    cover?: string
    runes?: string
    order?: number
  }

  export const posts: RawPostFile[]
  export const collections: RawCollection[]
  export const siteStartDate: string
  /** 生产构建期被物理剔除的文件名 */
  export const excluded: string[]
}
