import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  adminApi,
  publicApi,
  type ApiCollection,
  type ApiPost,
  type CollectionPayload,
  type PostPayload,
} from '@/api'
import { apiReady } from '@/lib/http'
import { useAuthStore } from '@/stores/auth'
import type { Collection, Post } from '@/types'

function fallbackDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function mapPost(source: ApiPost): Post {
  return {
    id: source.slug,
    remoteId: source.id,
    title: source.title,
    subtitle: source.subtitle ?? '',
    date: source.publishedAt ?? fallbackDate(),
    categories: source.categories ?? [],
    tags: source.tags ?? [],
    collections: source.collections ?? [],
    cover: source.cover ?? '',
    excerpt: source.excerpt ?? '',
    content: source.content ?? '',
    pinned: Boolean(source.pinned),
    hidden: source.status === 'hidden',
    draft: source.status === 'draft',
    public: source.status !== 'draft',
    source: undefined,
  }
}

function mapCollection(source: ApiCollection): Collection {
  return {
    id: source.slug,
    remoteId: source.id,
    title: source.title,
    subtitle: source.subtitle ?? '',
    description: source.description ?? '',
    cover: source.cover ?? '',
    runes: source.runes ?? '',
    order: source.sort ?? 99,
  }
}

function statusOf(post: Post): PostPayload['status'] {
  if (post.draft) return 'draft'
  if (post.hidden) return 'hidden'
  return 'published'
}

function toPayload(post: Post, withSlug: boolean): PostPayload {
  return {
    slug: withSlug ? post.id : undefined,
    title: post.title,
    subtitle: post.subtitle || undefined,
    excerpt: post.excerpt || undefined,
    tags: post.tags,
    content: post.content,
    cover: post.cover || undefined,
    status: statusOf(post),
    pinned: post.pinned,
    publishedAt: post.date,
    categories: post.categories,
    collections: post.collections,
  }
}

/**
 * 内容仓库：文章与综集全部来自 Spring Boot REST API，不再保留任何构建期静态数据。
 * 后端不可用时列表为空，页面展示「无法连接后端」的错误态。
 */
export const useContentStore = defineStore('content', () => {
  const auth = useAuthStore()

  const remotePosts = ref<Post[] | null>(null)
  const remoteCollections = ref<Collection[] | null>(null)
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')
  const lastAction = ref<{ message: string; at: number } | null>(null)
  const mutations = ref(0)

  const allPosts = computed<Post[]>(() => remotePosts.value ?? [])
  const collections = computed<Collection[]>(() => remoteCollections.value ?? [])
  const publicPosts = computed(() =>
    allPosts.value.filter((p) => !p.hidden && !p.draft && p.public !== false),
  )

  const categories = computed(() => {
    const counter = new Map<string, number>()
    for (const post of publicPosts.value) {
      for (const cat of post.categories) counter.set(cat, (counter.get(cat) ?? 0) + 1)
    }
    return [...counter.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  })

  async function load(): Promise<void> {
    if (!apiReady) {
      error.value = '未配置 VITE_API_BASE_URL，无法加载内容'
      loaded.value = true
      return
    }
    loading.value = true
    error.value = ''
    try {
      const includeAll = auth.isAdmin
      const [posts, cols] = await Promise.all([
        includeAll ? adminApi.posts() : publicApi.posts(),
        includeAll ? adminApi.collections() : publicApi.collections(),
      ])
      remotePosts.value = posts.map(mapPost)
      remoteCollections.value = cols.map(mapCollection)
      loaded.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '内容加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  function remember(message: string) {
    lastAction.value = { message, at: Date.now() }
    mutations.value += 1
  }

  function findBySlug(slugOrId: string): Post | undefined {
    return allPosts.value.find((p) => p.id === slugOrId)
  }

  async function savePost(post: Post): Promise<Post> {
    if (!apiReady) throw new Error('当前是静态只读模式，写入需要连接后端 API')
    const payload = toPayload(post, !post.remoteId)
    if (post.remoteId) {
      await adminApi.updatePost(post.remoteId, payload)
      remember(`更新《${post.title}》`)
    } else {
      await adminApi.createPost(payload)
      remember(`新建《${post.title}》`)
    }
    await load()
    return post
  }

  async function deletePost(post: Post): Promise<void> {
    if (!apiReady) throw new Error('当前是静态只读模式，删除需要连接后端 API')
    if (!post.remoteId) throw new Error('这篇文章没有后端 ID，无法删除')
    await adminApi.deletePost(post.remoteId)
    remember(`删除《${post.title}》`)
    await load()
  }

  async function toggleFlag(id: string, flag: 'pinned' | 'hidden' | 'draft'): Promise<void> {
    const post = allPosts.value.find((p) => p.id === id)
    if (!post) return
    if (!post.remoteId) throw new Error('这篇文章没有后端 ID，无法修改状态')
    if (flag === 'pinned') {
      await adminApi.flags(post.remoteId, { pinned: !post.pinned })
    } else if (flag === 'hidden') {
      await adminApi.flags(post.remoteId, { status: post.hidden ? 'published' : 'hidden' })
    } else {
      await adminApi.flags(post.remoteId, { status: post.draft ? 'published' : 'draft' })
    }
    remember('更新文章状态')
    await load()
  }

  async function saveCollection(collection: Collection): Promise<void> {
    if (!apiReady) throw new Error('当前是静态只读模式，写入需要连接后端 API')
    const payload: CollectionPayload = {
      slug: collection.remoteId ? undefined : collection.id,
      title: collection.title,
      subtitle: collection.subtitle || undefined,
      description: collection.description || undefined,
      cover: collection.cover || undefined,
      runes: collection.runes || undefined,
      sort: collection.order,
    }
    if (collection.remoteId) {
      await adminApi.updateCollection(collection.remoteId, payload)
      remember(`更新综集《${collection.title}》`)
    } else {
      await adminApi.createCollection(payload)
      remember(`新建综集《${collection.title}》`)
    }
    await load()
  }

  async function deleteCollection(id: string): Promise<void> {
    if (!apiReady) throw new Error('当前是静态只读模式，删除需要连接后端 API')
    const collection = collections.value.find((item) => item.id === id)
    if (!collection?.remoteId) throw new Error('这个综集没有后端 ID，无法删除')
    await adminApi.deleteCollection(collection.remoteId)
    remember(`删除综集《${collection.title}》`)
    await load()
  }

  async function importPosts(posts: Post[]): Promise<number> {
    if (!apiReady) throw new Error('当前是静态只读模式，导入需要连接后端 API')
    let count = 0
    for (const post of posts) {
      if (!post.title) continue
      try {
        await adminApi.createPost(toPayload(post, true))
        count += 1
      } catch {
        /* 单篇失败不阻塞其余 */
      }
    }
    if (count > 0) {
      remember(`导入 ${count} 篇文章`)
      await load()
    }
    return count
  }

  async function resetOverlay(): Promise<void> {
    await load()
    lastAction.value = null
    mutations.value = 0
  }

  function exportManifest(): { posts: Post[]; collections: Collection[] } {
    return { posts: allPosts.value, collections: collections.value }
  }

  return {
    remotePosts,
    loading,
    loaded,
    error,
    lastAction,
    mutations,
    allPosts,
    publicPosts,
    collections,
    categories,
    load,
    findBySlug,
    savePost,
    deletePost,
    toggleFlag,
    saveCollection,
    deleteCollection,
    importPosts,
    resetOverlay,
    exportManifest,
  }
})
