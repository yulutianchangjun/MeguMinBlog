import { STORAGE_PREFIX } from '@/lib/storage'

/**
 * 第四版起，内容与评论都不再进 localStorage：
 * - 文章/综集：构建期来自仓库，后台写入 GitHub commit
 * - 评论：GitHub Discussions（giscus）
 * 这里做一次性迁移，清掉旧版本遗留的演示数据与离线登录痕迹。
 */
const DATA_VERSION = '5'
const VERSION_KEY = `${STORAGE_PREFIX}data-version`

const LEGACY_KEYS = [
  'content',
  'comments',
  'messages',
  'auth',
  'nickname',
  'uv',
  'likes',
  'liked',
  'profile',
  'checkin',
  'board-name',
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
