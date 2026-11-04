import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { site } from '@/data/site'
import { readJSON, writeJSON } from '@/lib/storage'

interface AuthState {
  method: 'pat' | 'passphrase' | null
  login: string
  at: number
}

const SESSION_KEY = 'mgm:auth-session'

export const useAuthStore = defineStore('auth', () => {
  const state = ref<AuthState | null>(readJSON<AuthState | null>('auth', null))
  const loading = ref(false)
  const error = ref('')

  const isAdmin = computed(() => Boolean(state.value))

  function persist(next: AuthState | null) {
    state.value = next
    if (next) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
    } else {
      sessionStorage.removeItem(SESSION_KEY)
      writeJSON('auth', null)
    }
  }

  // 会话级令牌：关闭浏览器即失效，避免 PAT 长期留在本地
  const cached = sessionStorage.getItem(SESSION_KEY)
  if (cached && !state.value) {
    try {
      state.value = JSON.parse(cached) as AuthState
    } catch {
      /* noop */
    }
  }

  async function loginWithPat(token: string): Promise<boolean> {
    error.value = ''
    loading.value = true
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github+json',
        },
      })
      if (!res.ok) {
        error.value = res.status === 401 ? '令牌无效或已过期（401）' : `GitHub 校验失败（${res.status}）`
        return false
      }
      const user = (await res.json()) as { login?: string }
      const login = user.login ?? ''
      const expected = site.admin.githubLogin.trim()
      if (expected && login.toLowerCase() !== expected.toLowerCase()) {
        error.value = `该令牌属于 @${login}，不是本站博主账号`
        return false
      }
      persist({ method: 'pat', login, at: Date.now() })
      return true
    } catch {
      error.value = '无法连接 GitHub（网络受限时可使用离线口令）'
      return false
    } finally {
      loading.value = false
    }
  }

  function loginWithPassphrase(passphrase: string): boolean {
    error.value = ''
    if (passphrase.trim() === site.admin.demoPassphrase) {
      persist({ method: 'passphrase', login: site.author.name, at: Date.now() })
      return true
    }
    error.value = '口令不对。提示：一句咏唱的最后一个词。'
    return false
  }

  function logout() {
    persist(null)
  }

  return { state, isAdmin, loading, error, loginWithPat, loginWithPassphrase, logout }
})
