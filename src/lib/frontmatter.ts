/**
 * 极简 YAML Frontmatter 解析器（浏览器可用，不依赖 Buffer）。
 * 支持：字符串、数字、布尔、行内数组、块级数组、引号包裹的字符串。
 */

export interface Frontmatter {
  data: Record<string, unknown>
  content: string
}

function stripQuotes(input: string): string {
  const value = input.trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

function parseScalar(raw: string): unknown {
  const value = stripQuotes(raw)
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null' || value === '') return ''
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
  return value
}

export function parseFrontmatter(raw: string): Frontmatter {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  if (!text.startsWith('---')) {
    return { data: {}, content: text.trim() }
  }
  const end = text.indexOf('\n---', 3)
  if (end === -1) return { data: {}, content: text.trim() }

  const head = text.slice(3, end).trim()
  const content = text.slice(text.indexOf('\n', end + 1) + 1).trim()
  const data: Record<string, unknown> = {}
  const lines = head.split('\n')

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const match = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line)
    if (!match) {
      i += 1
      continue
    }
    const key = match[1]
    const rest = match[2].trim()

    if (rest === '') {
      // 块级数组或嵌套对象（仅支持数组）
      const items: unknown[] = []
      let j = i + 1
      while (j < lines.length) {
        const child = lines[j]
        const listMatch = /^\s*-\s+(.*)$/.exec(child)
        if (listMatch) {
          items.push(parseScalar(listMatch[1]))
          j += 1
          continue
        }
        if (/^\s+\S/.test(child) && !/^\s*[A-Za-z0-9_-]+\s*:/.test(child)) {
          j += 1
          continue
        }
        break
      }
      data[key] = items
      i = j
      continue
    }

    if (rest.startsWith('[') && rest.endsWith(']')) {
      const inner = rest.slice(1, -1).trim()
      data[key] = inner
        ? inner.split(',').map((part) => parseScalar(part))
        : []
      i += 1
      continue
    }

    data[key] = parseScalar(rest)
    i += 1
  }

  return { data, content }
}

function formatValue(value: unknown): string {
  if (typeof value === 'boolean' || typeof value === 'number') return String(value)
  const str = String(value ?? '')
  if (str === '' || /[:#\[\]{}]|^\s|\s$/.test(str)) return JSON.stringify(str)
  return str
}

export function stringifyFrontmatter(data: Record<string, unknown>, content: string): string {
  const lines: string[] = ['---']
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      if (!value.length) continue
      lines.push(`${key}:`)
      for (const item of value) lines.push(`  - ${formatValue(item)}`)
    } else if (value === '') {
      continue
    } else {
      lines.push(`${key}: ${formatValue(value)}`)
    }
  }
  lines.push('---', '', content.trim(), '')
  return lines.join('\n')
}
