import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { adminApi, publicApi, type ApiMessage } from '@/api'
import { apiReady } from '@/lib/http'
import { readJSON, writeJSON } from '@/lib/storage'
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
 * 互动数据：
 * - 留言墙便签：全部来自 MySQL blog_message_board，不再有本地 localStorage 兜底
 * - 点赞仍是本机行为（后端暂未建点赞表，属于访客侧轻互动）
 */
export const useInteractionStore = defineStore('interaction', () => {
  const likes = ref<Record<string, number>>(readJSON('likes', {}))
  const liked = ref<Record<string, boolean>>(readJSON('liked', {}))
  const error = ref('')

  const messages = ref<BoardMessage[]>([])

  async function load(): Promise<void> {
    if (!apiReady) {
      error.value = '未配置 VITE_API_BASE_URL，无法加载留言'
      return
    }
    try {
      messages.value = (await publicApi.messages()).map(mapMessage)
      error.value = ''
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
    if (!apiReady) throw new Error('未连接后端，留言功能需要后端 API')
    const created = await publicApi.createMessage({ ...payload, turnstileToken })
    const mapped = mapMessage(created)
    messages.value = [...messages.value, mapped]
    return mapped
  }

  async function toggleMessagePin(id: string): Promise<void> {
    const message = messages.value.find((item) => item.id === id)
    if (!message) return
    if (!message.remoteId) throw new Error('这条留言没有后端 ID，无法操作')
    await adminApi.pinMessage(message.remoteId, !message.pinned)
    messages.value = messages.value.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m))
  }

  async function deleteMessage(id: string): Promise<void> {
    const message = messages.value.find((item) => item.id === id)
    if (!message) return
    if (!message.remoteId) throw new Error('这条留言没有后端 ID，无法删除')
    await adminApi.deleteMessage(message.remoteId)
    messages.value = messages.value.filter((m) => m.id !== id)
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
  }
})
