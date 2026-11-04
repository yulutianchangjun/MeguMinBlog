import { postFromMarkdown } from '@/lib/post'
import collectionsData from '../../content/collections.json'
import type { Collection, Post } from '@/types'

const rawFiles = import.meta.glob('/content/posts/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

function fileId(path: string): string {
  return path.split('/').pop()?.replace(/\.md$/i, '') ?? path
}

export const seedPosts: Post[] = Object.entries(rawFiles)
  .map(([path, raw]) => {
    const post = postFromMarkdown(raw, fileId(path))
    post.source = path
    return post
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1))

interface CollectionsFile {
  siteStartDate?: string
  collections?: Collection[]
}

const collectionsFile = collectionsData as CollectionsFile

export const seedCollections: Collection[] = [...(collectionsFile.collections ?? [])].sort(
  (a, b) => (a.order ?? 99) - (b.order ?? 99),
)

export const siteStartDate: string = collectionsFile.siteStartDate ?? '2024-04-01'
