export function resolveAsset(path?: string): string {
  if (!path) return ''
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  const base = import.meta.env.BASE_URL
  return `${base}${path.replace(/^\.?\//, '')}`
}
