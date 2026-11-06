import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/atom-one-dark.css'

export interface TocItem {
  id: string
  text: string
  level: number
}

export function slugify(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return base || 'section'
}

function plainText(inline: string): string {
  return inline
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .trim()
}

export const md: MarkdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: false,
  highlight(code: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code class="language-${lang}">${hljs.highlight(code, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch {
        /* fall through */
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(code)}</code></pre>`
  },
})

md.core.ruler.push('heading_anchors', (state) => {
  const env = state.env as { toc?: TocItem[] }
  const toc: TocItem[] = []
  const used = new Map<string, number>()

  for (let i = 0; i < state.tokens.length; i += 1) {
    const token = state.tokens[i]
    if (token.type !== 'heading_open') continue
    const level = Number(token.tag.slice(1))
    const inline = state.tokens[i + 1]
    const raw = inline && inline.type === 'inline' ? inline.content : ''
    const text = plainText(raw)
    if (!text) continue

    let id = slugify(text)
    const count = used.get(id) ?? 0
    used.set(id, count + 1)
    if (count > 0) id = `${id}-${count + 1}`

    token.attrSet('id', id)
    if (level === 2 || level === 3) toc.push({ id, text, level })
  }
  env.toc = toc
})

const defaultLinkOpen =
  md.renderer.rules.link_open ??
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet('href') ?? ''
  if (/^https?:/i.test(href)) {
    tokens[idx].attrSet('target', '_blank')
    tokens[idx].attrSet('rel', 'noopener noreferrer')
  }
  return defaultLinkOpen(tokens, idx, options, env, self)
}

export function renderMarkdown(source: string): { html: string; toc: TocItem[] } {
  const env: { toc?: TocItem[] } = {}
  const html = md.render(source || '', env)
  return { html, toc: env.toc ?? [] }
}

export function readingMinutes(source: string): number {
  const cjk = (source.match(/[\u4e00-\u9fa5]/g) ?? []).length
  const words = source
    .replace(/[\u4e00-\u9fa5]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(cjk / 380 + words / 220))
}
