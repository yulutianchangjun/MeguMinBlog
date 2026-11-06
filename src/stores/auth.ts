import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi, type ApiUser } from '@/api'
import { ApiError, apiReady, tokenStore } from '@/lib/http'

interface AuthUser {
  id: number
  username: string
  nickname: string
  avatar: string
  at: number
}

const USER_KEY = 'mgm:api-user'

function readUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function toAuthUser(user: ApiUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname ?? user.username,
    avatar: user.avatar ?? '',
    at: Date.now(),
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(readUser())
  const loading = ref(false)
  const error = ref('')

  const token = computed(() => tokenStore.get())
  const isAdmin = computed(() => Boolean(user.value && token.value))
  const login = computed(() => user.value?.username ?? '')
  const avatar = computed(() => user.value?.avatar ?? '')

  function persist(next: AuthUser | null) {
    user.value = next
    try {
      if (next) localStorage.setItem(USER_KEY, JSON.stringify(next))
      else localStorage.removeItem(USER_KEY)
    } catch {
      /* noop */
    }
  }

  /** 账号密码登录：后端校验 sys_user 后签发 JWT，并在 Redis 里维护会话白名单 */
  async function loginWithPassword(username: string, password: string): Promise<boolean> {
    error.value = ''
    if (!apiReady) {
      error.value = '未配置后端地址（VITE_API_BASE_URL），当前为只读静态模式'
      return false
    }
    loading.value = true
    try {
      const result = await authApi.login(username.trim(), password)
      tokenStore.set(result.token)
      persist(toAuthUser(result.user))
      return true
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : '登录失败，请稍后重试'
      return false
    } finally {
      loading.value = false
    }
  }

  /** 刷新页面后用 Redis 中的会话校验令牌是否仍然有效 */
  async function restore(): Promise<void> {
    if (!apiReady || !tokenStore.get()) return
    try {
      const me = await authApi.me()
      persist({ ...toAuthUser(me), at: user.value?.at ?? Date.now() })
    } catch {
      tokenStore.clear()
      persist(null)
    }
  }

  function logout() {
    if (apiReady && tokenStore.get()) {
      void authApi.logout().catch(() => undefined)
    }
    tokenStore.clear()
    persist(null)
    error.value = ''
  }

  return { user, login, avatar, isAdmin, loading, error, token, loginWithPassword, restore, logout }
})
