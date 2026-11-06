import dayjs from 'dayjs'

export function formatDate(value: string | number | Date, template = 'YYYY.MM.DD'): string {
  return dayjs(value).format(template)
}

export function formatRelative(value: number): string {
  const diff = Date.now() - value
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 8) return `${days} 天前`
  return dayjs(value).format('YYYY.MM.DD')
}

export function assetUrl(path?: string): string {
  if (!path) return ''
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path
  const base = import.meta.env.BASE_URL
  const clean = path.replace(/^\.?\//, '')
  return `${base}${clean}`
}
