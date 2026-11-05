import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { adminApi, publicApi, type ApiMessage } from '@/api'
import { apiReady } from '@/lib/http'
import { readJSON, uid, writeJSON } from '@/lib/storage'
import type { BoardMessage, BoardTexture, BoardWall } from '@/types'

function mapMessage(source: ApiMessage): BoardMessage {
  return {
    id: `m-${source.id}`,
    remoteId: source.id,
    author: source.author,
    content: source.content,
    createdAt: new Date(source.createdAt).getTime(),
    wall: source.wall,
    bgColor: source.bgColor,
    fontColor: source.fontColor,
    texture: source.texture,
    rotation: source.rotation,
    pinned: Boolean(source.pinned),
  }
}

/**
 * 互动：
 * - 留言墙便签：配置后端后写入 MySQL；未配置时退回 localStorage（只读预览）
 * - 点赞仍是本机行为（后端暂未建点赞表）
 * - 文章评论走 GitHub Discussions（giscus），不在这里
 */
export const useInteractionStore = defineStore('interaction', () => {
  const likes = ref<Record<string, number>>(readJSON('likes', {}))
  const liked = ref<Record<string, boolean>>(readJSON('liked', {}))
  const error = ref('')

  const normalizeTexture = (texture: string): BoardTexture =>
    texture === 'magic' ? 'stars' : (texture as BoardTexture)

  const messages = ref<BoardMessage[]>(
    readJSON<BoardMessage[]>('messages', []).map((message) => ({
      ...message,
      texture: normalizeTexture(message.texture),
    })),
  )

  function saveMessages() {
    if (!apiReady) writeJSON('messages', messages.value)
  }

  async function load(): Promise<void> {
    if (!apiReady) return
    try {
      messages.value = (await publicApi.messages()).map(mapMessage)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '留言加载失败'
    }
  }

  function likeTotal(postId: string): number {
    return likes.value[postId] ?? 0
  }

  function hasLiked(postId: string): boolean {
    return Boolean(liked.value[postId])
  }

  function toggleLike(postId: string): void {
    const now = !liked.value[postId]
    liked.value = { ...liked.value, [postId]: now }
    likes.value = {
      ...likes.value,
      [postId]: Math.max(0, (likes.value[postId] ?? 0) + (now ? 1 : -1)),
    }
    writeJSON('liked', liked.value)
    writeJSON('likes', likes.value)
  }

  const pinnedMessages = computed(() => messages.value.filter((message) => message.pinned))

  async function addMessage(
    payload: {
      author: string
      content: string
      wall: BoardWall
      bgColor: string
      fontColor: string
      texture: BoardTexture
    },
    turnstileToken = '',
  ): Promise<BoardMessage> {
    if (apiReady) {
      const created = await publicApi.createMessage({ ...payload, turnstileToken })
      const mapped = mapMessage(created)
      messages.value = [...messages.value, mapped]
      return mapped
    }
    const message: BoardMessage = {
      id: uid('m-'),
      author: payload.author.trim() || '匿名旅人',
      content: payload.content.trim(),
      createdAt: Date.now(),
      wall: payload.wall,
      bgColor: payload.bgColor,
      fontColor: payload.fontColor,
      texture: payload.texture,
      rotation: Number((Math.random() * 5 - 2.5).toFixed(2)),
    }
    messages.value = [...messages.value, message]
    saveMessages()
    return message
  }

  async function toggleMessagePin(id: string): Promise<void> {
    const message = messages.value.find((item) => item.id === id)
    if (!message) return
    if (apiReady && message.remoteId) {
      await adminApi.pinMessage(message.remoteId, !message.pinned)
    }
    messages.value = messages.value.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m))
    saveMessages()
  }

  async function deleteMessage(id: string): Promise<void> {
    const message = messages.value.find((item) => item.id === id)
    if (!message) return
    if (apiReady && message.remoteId) {
      await adminApi.deleteMessage(message.remoteId)
    }
    messages.value = messages.value.filter((m) => m.id !== id)
    saveMessages()
  }

  function importMessages(list: BoardMessage[]): number {
    const ids = new Set(messages.value.map((m) => m.id))
    const fresh = list.filter((item) => !ids.has(item.id))
    if (fresh.length) {
      messages.value = [...messages.value, ...fresh]
      saveMessages()
    }
    return fresh.length
  }

  return {
    likes,
    messages,
    pinnedMessages,
    error,
    load,
    likeTotal,
    hasLiked,
    toggleLike,
    addMessage,
    toggleMessagePin,
    deleteMessage,
    importMessages,
  }
})
