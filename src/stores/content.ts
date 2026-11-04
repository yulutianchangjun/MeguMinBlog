import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { seedCollections, seedPosts } from '@/data/posts'
import { readJSON, writeJSON } from '@/lib/storage'
import type { Collection, ContentOverlay, Post } from '@/types'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const EMPTY: ContentOverlay = {
  created: [],
  updated: {},
  deleted: [],
  collectionsCreated: [],
  collectionsUpdated: {},
  collectionsDeleted: [],
}

export const useContentStore = defineStore('content', () => {
  const stored = readJSON<ContentOverlay>('content', clone(EMPTY))
  const overlay = ref<ContentOverlay>({
    ...clone(EMPTY),
    ...stored,
    updated: stored.updated ?? {},
    collectionsUpdated: stored.collectionsUpdated ?? {},
    collectionsDeleted: stored.collectionsDeleted ?? [],
  })

  function persist() {
    writeJSON('content', overlay.value)
  }

  const allPosts = computed<Post[]>(() => {
    const deleted = new Set(overlay.value.deleted)
    const merged: Post[] = []
    for (const seed of seedPosts) {
      if (deleted.has(seed.id)) continue
      merged.push(overlay.value.updated[seed.id] ?? { ...seed })
    }
    for (const item of overlay.value.created) {
      if (deleted.has(item.id)) continue
      merged.push(item)
    }
    return merged.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  })

  const publicPosts = computed(() => allPosts.value.filter((p) => !p.hidden && !p.draft))

  const collections = computed<Collection[]>(() => {
    const deleted = new Set(overlay.value.collectionsDeleted)
    const merged = [...seedCollections, ...overlay.value.collectionsCreated]
      .filter((c) => !deleted.has(c.id))
      .map((c) => overlay.value.collectionsUpdated[c.id] ?? c)
    return merged.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
  })

  const categories = computed(() => {
    const counter = new Map<string, number>()
    for (const post of publicPosts.value) {
      for (const cat of post.categories) counter.set(cat, (counter.get(cat) ?? 0) + 1)
    }
    return [...counter.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  })

  function findBySlug(slugOrId: string): Post | undefined {
    return allPosts.value.find((p) => p.id === slugOrId)
  }

  function isSeed(id: string): boolean {
    return seedPosts.some((p) => p.id === id)
  }

  function savePost(post: Post): void {
    const next = clone(overlay.value)
    next.deleted = next.deleted.filter((id) => id !== post.id)
    if (isSeed(post.id)) {
      next.updated[post.id] = post
    } else {
      const index = next.created.findIndex((p) => p.id === post.id)
      if (index >= 0) next.created[index] = post
      else next.created.unshift(post)
    }
    overlay.value = next
    persist()
  }

  function deletePost(id: string): void {
    const next = clone(overlay.value)
    next.updated = Object.fromEntries(
      Object.entries(next.updated).filter(([key]) => key !== id),
    ) as Record<string, Post>
    next.created = next.created.filter((p) => p.id !== id)
    if (isSeed(id) && !next.deleted.includes(id)) next.deleted.push(id)
    overlay.value = next
    persist()
  }

  function toggleFlag(id: string, flag: 'pinned' | 'hidden' | 'draft'): void {
    const post = allPosts.value.find((p) => p.id === id)
    if (!post) return
    savePost({ ...post, [flag]: !post[flag] })
  }

  function isSeedCollection(id: string): boolean {
    return seedCollections.some((c) => c.id === id)
  }

  function saveCollection(collection: Collection): void {
    const next = clone(overlay.value)
    next.collectionsDeleted = next.collectionsDeleted.filter((id) => id !== collection.id)
    if (isSeedCollection(collection.id)) {
      next.collectionsUpdated[collection.id] = collection
    } else {
      const index = next.collectionsCreated.findIndex((c) => c.id === collection.id)
      if (index >= 0) next.collectionsCreated[index] = collection
      else next.collectionsCreated.push(collection)
    }
    overlay.value = next
    persist()
  }

  function deleteCollection(id: string): void {
    const next = clone(overlay.value)
    next.collectionsCreated = next.collectionsCreated.filter((c) => c.id !== id)
    next.collectionsUpdated = Object.fromEntries(
      Object.entries(next.collectionsUpdated).filter(([key]) => key !== id),
    ) as Record<string, Collection>
    if (isSeedCollection(id) && !next.collectionsDeleted.includes(id)) {
      next.collectionsDeleted.push(id)
    }
    overlay.value = next
    persist()
  }

  function importPosts(posts: Post[]): number {
    const next = clone(overlay.value)
    let count = 0
    for (const post of posts) {
      if (!post.id || !post.title) continue
      next.deleted = next.deleted.filter((id) => id !== post.id)
      if (isSeed(post.id)) {
        next.updated[post.id] = post
      } else {
        const index = next.created.findIndex((p) => p.id === post.id)
        if (index >= 0) next.created[index] = post
        else next.created.unshift(post)
      }
      count += 1
    }
    overlay.value = next
    persist()
    return count
  }

  function resetAll(): void {
    overlay.value = clone(EMPTY)
    persist()
  }

  function exportManifest(): { posts: Post[]; collections: Collection[] } {
    return { posts: allPosts.value, collections: collections.value }
  }

  return {
    overlay,
    allPosts,
    publicPosts,
    collections,
    categories,
    findBySlug,
    savePost,
    deletePost,
    toggleFlag,
    saveCollection,
    deleteCollection,
    importPosts,
    resetAll,
    exportManifest,
  }
})
