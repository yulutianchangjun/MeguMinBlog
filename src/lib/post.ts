import { parseFrontmatter } from './frontmatter'
import type { Post } from '@/types'

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

export function normalizeDate(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw) return new Date().toISOString().slice(0, 10)
  const cleaned = raw.replace(/[年月/.]/g, '-').replace(/日/g, '')
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(cleaned)
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  }
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
  return new Date().toISOString().slice(0, 10)
}

export function postFromMarkdown(raw: string, fallbackId: string): Post {
  const { data, content } = parseFrontmatter(raw)
  const id = String(data.id ?? data.slug ?? fallbackId).trim()
  return {
    id,
    title: String(data.title ?? '无题').trim(),
    subtitle: data.subtitle ? String(data.subtitle) : '',
    date: normalizeDate(data.date),
    updated: data.updated ? normalizeDate(data.updated) : '',
    categories: toArray(data.categories ?? data.category),
    tags: toArray(data.tags),
    collections: toArray(data.collections ?? data.collection),
    cover: data.cover ? String(data.cover) : '',
    excerpt: data.excerpt ? String(data.excerpt) : content.replace(/[#>*`\-]/g, '').slice(0, 96),
    content,
    pinned: data.pinned === true || data.pinned === 'true',
    hidden: data.hidden === true || data.hidden === 'true',
    draft: data.draft === true || data.draft === 'true',
  }
}
