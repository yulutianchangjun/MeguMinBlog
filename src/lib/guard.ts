const KEY = 'mgm:turnstile-pass'
const TTL = 30 * 60 * 1000

/**
 * 纯静态站点无法在服务端验证 Turnstile token，
 * 这里只记住「本会话已通过一次人机校验」，避免每翻一篇文章都重新勾选。
 * 真正的服务端校验见 docs/博主身份绑定与发布指南.md 里的 Worker 示例。
 */
export function hasGuardPass(): boolean {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return false
    const at = Number(raw)
    return Number.isFinite(at) && Date.now() - at < TTL
  } catch {
    return false
  }
}

export function markGuardPass(): void {
  try {
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    /* noop */
  }
}
