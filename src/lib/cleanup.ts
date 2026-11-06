import { STORAGE_PREFIX } from '@/lib/storage'

/**
 * 第六版起，前端不再保存任何静态内容数据：
 * - 文章/综集/曲库/签到/UV/纪念日：全部来自后端 REST API
 * - localStorage 只保留登录 token、点赞、播放器偏好等本机轻量状态
 * 这里做一次性迁移，清掉旧版本遗留的本地数据缓存。
 */
const DATA_VERSION = '6'
const VERSION_KEY = `${STORAGE_PREFIX}data-version`

const LEGACY_KEYS = [
  'content',
  'comments',
  'messages',
  'auth',
  'nickname',
  'uv',
  'visitor-id',
  'likes',
  'liked',
  'profile',
  'checkin',
  'board-name',
  'player',
  'github-token',
  'github-user',
  'turnstile-pass',
]

export function purgeLegacyTestData(): void {
  try {
    if (localStorage.getItem(VERSION_KEY) === DATA_VERSION) return
    for (const key of LEGACY_KEYS) {
      localStorage.removeItem(STORAGE_PREFIX + key)
    }
    sessionStorage.removeItem(`${STORAGE_PREFIX}auth-session`)
    localStorage.setItem(VERSION_KEY, DATA_VERSION)
  } catch {
    /* 隐私模式下存储不可用，忽略即可 */
  }
}
