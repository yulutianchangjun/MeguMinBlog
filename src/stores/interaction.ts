import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { adminApi, publicApi, type ApiMessage } from '@/api'
import { apiReady } from '@/lib/http'
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
 * - 点赞：已入库（blog_post_like，按 IP 去重），状态由 PostDetailView 走 /posts/{slug}/like 读取，
 *   总数随文章数据返回（post.likes），这里不再维护本地计数
 */
export const useInteractionStore = defineStore('interaction', () => {
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
    messages,
    pinnedMessages,
    error,
    load,
    addMessage,
    toggleMessagePin,
    deleteMessage,
  }
})
