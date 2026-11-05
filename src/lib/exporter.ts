import JSZip from 'jszip'
import { postFromMarkdown, postToMarkdown } from './post'
import type { BoardMessage, Collection, Post } from '@/types'

export interface ArchivePayload {
  posts: Post[]
  collections: Collection[]
  messages: BoardMessage[]
  siteStartDate: string
}

export interface ImportResult {
  posts: Post[]
  messages: BoardMessage[]
  files: number
}

const stamp = () => new Date().toISOString().slice(0, 10)

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function exportZip(payload: ArchivePayload): Promise<void> {
  const zip = new JSZip()
  const posts = zip.folder('posts')
  for (const post of payload.posts) {
    posts?.file(`${post.id}.md`, postToMarkdown(post))
  }
  zip.file(
    'collections.json',
    JSON.stringify({ siteStartDate: payload.siteStartDate, collections: payload.collections }, null, 2),
  )
  zip.file('data/messages.json', JSON.stringify(payload.messages, null, 2))
  zip.file(
    'README.md',
    `# 手记导出\n\n导出时间：${new Date().toLocaleString()}\n\n- posts/：Markdown + Frontmatter\n- collections.json：综集定义\n- data/：评论与留言备份\n\n重新导入时，直接把整个 ZIP 拖回管理面板即可。\n`,
  )
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  triggerDownload(blob, `megumin-blog-${stamp()}.zip`)
}

export function exportJson(payload: ArchivePayload): void {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          version: 1,
          exportedAt: new Date().toISOString(),
          ...payload,
        },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  )
  triggerDownload(blob, `megumin-blog-${stamp()}.json`)
}

function normalizeMessages(input: unknown): BoardMessage[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((item) => item && typeof item === 'object')
    .map((item) => item as BoardMessage)
    .filter((item) => item.id && item.content)
}

export async function parseImportFile(file: File): Promise<ImportResult> {
  const result: ImportResult = { posts: [], messages: [], files: 0 }
  const name = file.name.toLowerCase()

  if (name.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file)
    const entries = Object.values(zip.files)
    for (const entry of entries) {
      if (entry.dir) continue
      const lower = entry.name.toLowerCase()
      if (lower.endsWith('.md')) {
        const raw = await entry.async('string')
        const id = entry.name.split('/').pop()?.replace(/\.md$/i, '') ?? 'imported'
        result.posts.push(postFromMarkdown(raw, id))
        result.files += 1
      } else if (lower.endsWith('.json')) {
        const raw = await entry.async('string')
        try {
          const data = JSON.parse(raw)
          // 旧包的 comments.json 直接忽略：评论已迁移到 GitHub Discussions
          if (lower.includes('messages')) result.messages.push(...normalizeMessages(data))
        } catch {
          /* 跳过损坏的 JSON */
        }
      }
    }
    return result
  }

  if (name.endsWith('.md')) {
    const raw = await file.text()
    result.posts.push(postFromMarkdown(raw, file.name.replace(/\.md$/i, '')))
    result.files = 1
    return result
  }

  const raw = await file.text()
  const data = JSON.parse(raw) as Record<string, unknown>
  if (Array.isArray(data)) {
    result.posts = (data as Post[]).filter((post) => post?.title)
  } else if (Array.isArray(data.posts)) {
    result.posts = (data.posts as Post[]).filter((post) => post?.title)
  }
  result.messages = normalizeMessages(data.messages)
  result.files = result.posts.length ? 1 : 0
  return result
}
