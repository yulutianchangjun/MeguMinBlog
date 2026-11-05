import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))
const VIRTUAL_ID = 'virtual:content'
const RESOLVED_ID = '\0' + VIRTUAL_ID

interface RawPost {
  path: string
  raw: string
}

interface ContentBundle {
  posts: RawPost[]
  collections: unknown
  siteStartDate: string
  /** 开发期包含、构建期被剔除的文件 */
  excluded: string[]
}

/** 只读 frontmatter 里的布尔字段，避免在 Node 侧引入浏览器依赖 */
function readFlag(raw: string, key: string): boolean | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)
  if (!match) return null
  const line = new RegExp(`^${key}\\s*:\\s*(true|false)\\s*$`, 'm').exec(match[1])
  if (!line) return null
  return line[1] === 'true'
}

/**
 * 内容即代码：把 content/ 变成一个虚拟模块。
 * 生产构建时 draft: true / public: false 的文件根本不会进入 bundle，
 * 别人翻 DevTools 也找不到草稿的任何字句。
 */
function gitContentPlugin(): Plugin {
  let includeDrafts = true
  let root = projectRoot

  function readContent(): ContentBundle {
    const dir = path.join(root, 'content', 'posts')
    const posts: RawPost[] = []
    const excluded: string[] = []

    const files = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((file) => file.endsWith('.md')).sort()
      : []

    for (const file of files) {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8')
      const draft = readFlag(raw, 'draft') === true
      const isPrivate = readFlag(raw, 'public') === false
      if (!includeDrafts && (draft || isPrivate)) {
        excluded.push(file)
        continue
      }
      posts.push({ path: `/content/posts/${file}`, raw })
    }

    const collectionsPath = path.join(root, 'content', 'collections.json')
    let collections: { siteStartDate?: string; collections?: unknown[] } = {}
    if (fs.existsSync(collectionsPath)) {
      try {
        collections = JSON.parse(fs.readFileSync(collectionsPath, 'utf8'))
      } catch {
        collections = {}
      }
    }

    return {
      posts,
      collections: collections.collections ?? [],
      siteStartDate: collections.siteStartDate ?? '2026-11-05',
      excluded,
    }
  }

  return {
    name: 'megumin-git-content',
    configResolved(config) {
      root = config.root
      // dev 下保留草稿便于本地预览；build 一律剔除
      includeDrafts = config.command === 'serve'
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null
    },
    load(id) {
      if (id !== RESOLVED_ID) return null
      const bundle = readContent()
      if (!includeDrafts && bundle.excluded.length) {
        console.log(
          `\n[content] 已在构建期剔除 ${bundle.excluded.length} 篇草稿/私密文章：${bundle.excluded.join(', ')}\n`,
        )
      }
      return [
        `export const posts = ${JSON.stringify(bundle.posts)};`,
        `export const collections = ${JSON.stringify(bundle.collections)};`,
        `export const siteStartDate = ${JSON.stringify(bundle.siteStartDate)};`,
        `export const excluded = ${JSON.stringify(bundle.excluded)};`,
      ].join('\n')
    },
    configureServer(server) {
      const contentDir = path.join(root, 'content')
      server.watcher.add(contentDir)
      const reload = (file: string) => {
        if (!file.replace(/\\/g, '/').includes('/content/')) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', reload)
      server.watcher.on('change', reload)
      server.watcher.on('unlink', reload)
    },
  }
}

export default defineConfig({
  plugins: [vue(), VueDevTools(), gitContentPlugin()],
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1200,
    sourcemap: false,
  },
  server: {
    port: 5173,
    open: false,
  },
})
