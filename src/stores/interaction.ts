import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { seedComments, seedLikes, seedMessages } from '@/data/seed'
import { readJSON, uid, writeJSON } from '@/lib/storage'
import type { BoardMessage, BoardTexture, BoardWall, Comment } from '@/types'

export const useInteractionStore = defineStore('interaction', () => {
  const comments = ref<Comment[]>(readJSON<Comment[]>('comments', [...seedComments]))
  const likes = ref<Record<string, number>>(readJSON('likes', { ...seedLikes }))
  const liked = ref<Record<string, boolean>>(readJSON('liked', {}))
  const messages = ref<BoardMessage[]>(readJSON<BoardMessage[]>('messages', [...seedMessages]))

  function saveComments() {
    writeJSON('comments', comments.value)
  }
  function saveMessages() {
    writeJSON('messages', messages.value)
  }

  const commentsByPost = computed(() => (postId: string) =>
    comments.value
      .filter((c) => c.postId === postId)
      .sort((a, b) => {
        if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1
        return a.createdAt - b.createdAt
      }),
  )

  const commentCount = computed(() => (postId: string) =>
    comments.value.filter((c) => c.postId === postId).length,
  )

  function addComment(postId: string, author: string, content: string): Comment {
    const comment: Comment = {
      id: uid('c-'),
      postId,
      parentId: null,
      author: author.trim() || '匿名旅人',
      content: content.trim(),
      createdAt: Date.now(),
      isAdmin: false,
    }
    comments.value = [...comments.value, comment]
    saveComments()
    return comment
  }

  function addReply(postId: string, parentId: string, content: string): void {
    const parent = comments.value.find((c) => c.id === parentId)
    const rootId = parent?.parentId ?? parentId
    comments.value = [
      ...comments.value,
      {
        id: uid('c-'),
        postId,
        parentId: rootId,
        author: '惠惠',
        isAdmin: true,
        content: content.trim(),
        createdAt: Date.now(),
      },
    ]
    saveComments()
  }

  function toggleCommentPin(id: string): void {
    comments.value = comments.value.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    saveComments()
  }

  function deleteComment(id: string): void {
    const ids = new Set<string>([id])
    let changed = true
    while (changed) {
      changed = false
      for (const c of comments.value) {
        if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
          ids.add(c.id)
          changed = true
        }
      }
    }
    comments.value = comments.value.filter((c) => !ids.has(c.id))
    saveComments()
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

  function addMessage(payload: {
    author: string
    content: string
    wall: BoardWall
    bgColor: string
    fontColor: string
    texture: BoardTexture
  }): BoardMessage {
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

  function toggleMessagePin(id: string): void {
    messages.value = messages.value.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m))
    saveMessages()
  }

  function deleteMessage(id: string): void {
    messages.value = messages.value.filter((m) => m.id !== id)
    saveMessages()
  }

  function importComments(list: Comment[]): number {
    const ids = new Set(comments.value.map((c) => c.id))
    const fresh = list.filter((item) => !ids.has(item.id))
    if (fresh.length) {
      comments.value = [...comments.value, ...fresh]
      saveComments()
    }
    return fresh.length
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
    comments,
    messages,
    commentsByPost,
    commentCount,
    addComment,
    addReply,
    toggleCommentPin,
    deleteComment,
    likeTotal,
    hasLiked,
    toggleLike,
    addMessage,
    toggleMessagePin,
    deleteMessage,
    importComments,
    importMessages,
  }
})
