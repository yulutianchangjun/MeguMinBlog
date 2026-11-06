#!/usr/bin/env node
/**
 * 把 content/ 下的 Markdown 与 collections.json 生成 MySQL 种子 SQL。
 * 用法：node scripts/gen-seed.mjs
 * 输出：backend/src/main/resources/seed.sql（手工导入用，启动不会自动执行）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const postsDir = path.join(root, 'content', 'posts')
const collectionsFile = path.join(root, 'content', 'collections.json')

function parseFrontmatter(raw) {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  if (!text.startsWith('---')) return { data: {}, body: text.trim() }
  const end = text.indexOf('\n---', 3)
  if (end === -1) return { data: {}, body: text.trim() }
  const head = text.slice(3, end).trim()
  const body = text.slice(text.indexOf('\n', end + 1) + 1).trim()
  const data = {}
  const lines = head.split('\n')
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const match = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line)
    if (!match) continue
    const [, key, restRaw] = match
    const rest = restRaw.trim()
    if (rest === '') {
      const items = []
      let j = i + 1
      while (j < lines.length) {
        const item = /^\s*-\s+(.*)$/.exec(lines[j])
        if (!item) break
        items.push(unquote(item[1]))
        j += 1
      }
      data[key] = items
      i = j - 1
      continue
    }
    if (rest.startsWith('[') && rest.endsWith(']')) {
      data[key] = rest
        .slice(1, -1)
        .split(',')
        .map((part) => unquote(part))
        .filter(Boolean)
      continue
    }
    data[key] = scalar(rest)
  }
  return { data, body }
}

function unquote(value) {
  const v = String(value).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1)
  }
  return v
}

function scalar(value) {
  const v = unquote(value)
  if (v === 'true') return true
  if (v === 'false') return false
  return v
}

function asArray(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    return value.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function normalizeDate(value) {
  const raw = String(value ?? '').trim()
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(raw.replace(/[年月/.]/g, '-'))
  if (match) return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  return new Date().toISOString().slice(0, 10)
}

const q = (value) => {
  if (value === undefined || value === null || value === '') return 'NULL'
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
}

function excerptOf(body, explicit) {
  if (explicit) return String(explicit)
  return body.replace(/[#>*`\-\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90)
}

function catSlug(name) {
  const ascii = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (ascii) return ascii
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.codePointAt(0)) % 1000000007
  return `cat-${hash}`
}

// ---------- 读取 ----------
const collectionsJson = JSON.parse(fs.readFileSync(collectionsFile, 'utf8'))
const collections = collectionsJson.collections ?? []

const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md')).sort()
const posts = []
for (const file of files) {
  const raw = fs.readFileSync(path.join(postsDir, file), 'utf8')
  const { data, body } = parseFrontmatter(raw)
  const slug = file.replace(/\.md$/i, '')
  const draft = data.draft === true || String(data.draft) === 'true'
  const isPrivate = data.public === false || String(data.public) === 'false'
  posts.push({
    slug,
    title: String(data.title ?? '无题').trim(),
    subtitle: data.subtitle ? String(data.subtitle) : null,
    excerpt: excerptOf(body, data.excerpt),
    content: body,
    tags: asArray(data.tags),
    cover: data.cover ? String(data.cover) : null,
    status: draft || isPrivate ? 'draft' : data.hidden === true ? 'hidden' : 'published',
    pinned: data.pinned === true || String(data.pinned) === 'true' ? 1 : 0,
    date: normalizeDate(data.date),
    categories: asArray(data.categories ?? data.category),
    collections: asArray(data.collections ?? data.collection),
  })
}

const categories = [...new Set(posts.flatMap((p) => p.categories))].sort((a, b) => a.localeCompare(b, 'zh-CN'))

// ---------- 生成 ----------
const lines = [
  '-- 由 scripts/gen-seed.mjs 自动生成，请勿手改。',
  '-- 内容来源：content/posts/*.md + content/collections.json + 生成器内置的站点种子',
  'SET NAMES utf8mb4;',
  '',
  '-- 综集',
]
for (const [index, item] of collections.entries()) {
  lines.push(
    `INSERT IGNORE INTO blog_collection (slug, title, subtitle, description, cover, runes, sort) VALUES (${[
      q(item.id),
      q(item.title),
      q(item.subtitle),
      q(item.description),
      q(item.cover),
      q(item.runes),
      Number(item.order ?? index + 1),
    ].join(', ')});`,
  )
}

lines.push('', '-- 分类')
for (const [index, name] of categories.entries()) {
  lines.push(
    `INSERT IGNORE INTO blog_category (name, slug, sort) VALUES (${q(name)}, ${q(catSlug(name))}, ${index});`,
  )
}

lines.push('', '-- 文章')
for (const post of posts) {
  lines.push(
    `INSERT IGNORE INTO blog_post (slug, title, subtitle, excerpt, tags, content, cover, status, pinned, views, published_at) VALUES (${[
      q(post.slug),
      q(post.title),
      q(post.subtitle),
      q(post.excerpt),
      q(post.tags.join(',')),
      q(post.content),
      q(post.cover),
      q(post.status),
      post.pinned,
      0,
      q(post.date),
    ].join(', ')});`,
  )
}

lines.push('', '-- 文章 ↔ 分类')
for (const post of posts) {
  for (const name of post.categories) {
    lines.push(
      `INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = ${q(post.slug)} AND c.name = ${q(name)};`,
    )
  }
}

lines.push('', '-- 文章 ↔ 综集')
for (const post of posts) {
  for (const slug of post.collections) {
    lines.push(
      `INSERT IGNORE INTO blog_post_collection (post_id, collection_id) SELECT p.id, c.id FROM blog_post p, blog_collection c WHERE p.slug = ${q(post.slug)} AND c.slug = ${q(slug)};`,
    )
  }
}

// ---------- 站点种子：开站日期 / 纪念日 / 内置合成曲 ----------
// 纪念日与合成曲是站点级静态内容，写死在生成器里；INSERT IGNORE + 显式主键保证可重放。
const siteStartDate = collectionsJson.siteStartDate ?? '2026-11-05'
lines.push('', '-- 站点配置与纪念日倒计时')
lines.push(
  `INSERT IGNORE INTO blog_config (config_key, config_value) VALUES ('site.start-date', ${q(siteStartDate)});`,
)
const anniversaries = [
  { id: 1, label: '示例纪念日', date: '01-01', note: '在后台「站点设置」里改成你自己的纪念日', sort: 0 },
  { id: 2, label: '博客开站周年', date: '01-01', note: '与站点设置中的开站日期一致即可', sort: 1 },
]
for (const item of anniversaries) {
  lines.push(
    `INSERT IGNORE INTO blog_anniversary (id, label, memorial_date, note, sort) VALUES (${item.id}, ${q(item.label)}, ${q(item.date)}, ${q(item.note)}, ${item.sort});`,
  )
}

lines.push('', '-- 内置合成曲（kind=synth，url 对应前端 Web Audio 引擎的曲谱 id）')
const synthTunes = [
  { id: 1, title: '爆裂魔法のテーマ', url: 'explosion-theme', sort: 1 },
  { id: 2, title: '紅魔族の朝', url: 'red-demon-morning', sort: 2 },
  { id: 3, title: '荒野の夜', url: 'night-wilderness', sort: 3 },
]
for (const tune of synthTunes) {
  lines.push(
    `INSERT IGNORE INTO blog_music (id, title, artist, cover, url, kind, size, sort) VALUES (${tune.id}, ${q(tune.title)}, '惠惠的留声机', '', ${q(tune.url)}, 'synth', 0, ${tune.sort});`,
  )
}

lines.push('')

const sql = lines.join('\n')
// 种子只是手工导入的参考数据：启动与容器首启都不会自动执行。
const outputs = [path.join(root, 'backend', 'src', 'main', 'resources', 'seed.sql')]
for (const file of outputs) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, sql, 'utf8')
  console.log('written', path.relative(root, file), `${(sql.length / 1024).toFixed(1)}KB`)
}

// schema 同步到 deploy
const schemaSrc = path.join(root, 'backend', 'src', 'main', 'resources', 'schema.sql')
const schemaDst = path.join(root, 'deploy', 'mysql', 'init', '01-schema.sql')
fs.mkdirSync(path.dirname(schemaDst), { recursive: true })
fs.copyFileSync(schemaSrc, schemaDst)
console.log('written', path.relative(root, schemaDst))

console.log(`posts=${posts.length} categories=${categories.length} collections=${collections.length}`)
