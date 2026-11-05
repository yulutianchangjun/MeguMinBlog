import { collections as rawCollections, posts as rawPosts, siteStartDate as rawStartDate } from 'virtual:content'
import { postFromMarkdown } from '@/lib/post'
import type { Collection, Post } from '@/types'

function fileId(filePath: string): string {
  return filePath.split('/').pop()?.replace(/\.md$/i, '') ?? filePath
}

/**
 * 文章来自构建期生成的虚拟模块（见 vite.config.ts 的 gitContentPlugin）。
 * 生产构建中草稿与私密文章已被物理剔除，不会出现在任何 chunk 里。
 */
export const seedPosts: Post[] = rawPosts
  .map((file) => {
    const post = postFromMarkdown(file.raw, fileId(file.path))
    post.source = file.path
    return post
  })
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

export const seedCollections: Collection[] = [...rawCollections].sort(
  (a, b) => (a.order ?? 99) - (b.order ?? 99),
)

export const siteStartDate: string = rawStartDate
