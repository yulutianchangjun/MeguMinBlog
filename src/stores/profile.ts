import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { adminApi, publicApi, type ApiCheckin, type ApiUv } from '@/api'
import { apiReady } from '@/lib/http'
import { readJSON, uid, writeJSON } from '@/lib/storage'

export interface CheckinState {
  dates: string[]
  total: number
}

interface UvDay {
  date: string
  pv: number
  visitors: string[]
  views: Record<string, number>
}

interface UvState {
  days: Record<string, UvDay>
}

const dayKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const shiftDay = (iso: string, delta: number): string => {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + delta)
  return dayKey(date)
}

export const useProfileStore = defineStore('profile', () => {
  const checkin = ref<CheckinState>(readJSON<CheckinState>('checkin', { dates: [], total: 0 }))
  const uv = ref<UvState>(readJSON<UvState>('uv', { days: {} }))
  const visitorId = ref<string>(readJSON<string>('visitor-id', ''))
  const today = ref(dayKey())
  const remoteCheckin = ref<ApiCheckin | null>(null)
  const remoteUv = ref<ApiUv | null>(null)

  if (!visitorId.value) {
    visitorId.value = uid('v-')
    writeJSON('visitor-id', visitorId.value)
  }

  const checkedToday = computed(() =>
    remoteCheckin.value ? remoteCheckin.value.checkedToday : checkin.value.dates.includes(today.value),
  )

  const streak = computed(() => {
    if (remoteCheckin.value) return remoteCheckin.value.streak
    const set = new Set(checkin.value.dates)
    let cursor = set.has(today.value) ? today.value : shiftDay(today.value, -1)
    let count = 0
    while (set.has(cursor)) {
      count += 1
      cursor = shiftDay(cursor, -1)
    }
    return count
  })

  const totalDays = computed(() =>
    remoteCheckin.value ? remoteCheckin.value.total : checkin.value.total || checkin.value.dates.length,
  )

  const badges = computed(() => [
    { key: 'spark', label: '初燃', desc: '首次签到', threshold: 1, icon: 'spark' },
    { key: 'flame', label: '连爆七日', desc: '连续签到 7 天', threshold: 7, icon: 'flame' },
    { key: 'star', label: '月之魔女', desc: '累计签到 30 天', threshold: 30, icon: 'star' },
    { key: 'crown', label: '爆裂宗师', desc: '累计签到 100 天', threshold: 100, icon: 'crown' },
  ].map((badge) => ({
    ...badge,
    achieved:
      badge.key === 'flame'
        ? streak.value >= badge.threshold
        : totalDays.value >= badge.threshold,
  })))

  const nextBadge = computed(() => {
    const pending = badges.value.filter((b) => !b.achieved)
    return pending[0] ?? null
  })

  async function doCheckin(): Promise<{ ok: boolean; streak: number; message?: string }> {
    if (apiReady) {
      try {
        remoteCheckin.value = await adminApi.checkin()
        return { ok: true, streak: remoteCheckin.value.streak }
      } catch (err) {
        return { ok: false, streak: streak.value, message: err instanceof Error ? err.message : '签到失败' }
      }
    }
    if (checkedToday.value) return { ok: false, streak: streak.value }
    checkin.value = {
      dates: [...checkin.value.dates, today.value],
      total: checkin.value.total + 1,
    }
    writeJSON('checkin', checkin.value)
    return { ok: true, streak: streak.value }
  }

  async function loadCheckin(): Promise<void> {
    if (!apiReady) return
    try {
      remoteCheckin.value = await publicApi.checkin()
    } catch {
      /* 后端不可用时保留本地统计 */
    }
  }

  async function loadUv(): Promise<void> {
    if (!apiReady) return
    try {
      remoteUv.value = await adminApi.uv()
    } catch {
      remoteUv.value = null
    }
  }

  function track(path: string) {
    if (apiReady) {
      const slug = path.startsWith('/posts/') ? path.slice('/posts/'.length) : undefined
      void publicApi.track(path, slug).catch(() => undefined)
    }
    const key = today.value
    const state = uv.value
    const entry = state.days[key] ?? { date: key, pv: 0, visitors: [], views: {} }
    entry.pv += 1
    if (!entry.visitors.includes(visitorId.value)) entry.visitors.push(visitorId.value)
    entry.views[path] = (entry.views[path] ?? 0) + 1
    state.days[key] = entry
    uv.value = { days: { ...state.days } }
    writeJSON('uv', uv.value)
  }

  const uvSeries = computed(() => {
    if (remoteUv.value) return remoteUv.value.series
    const series: { date: string; label: string; pv: number; uv: number }[] = []
    for (let i = 13; i >= 0; i -= 1) {
      const key = shiftDay(today.value, -i)
      const entry = uv.value.days[key]
      series.push({
        date: key,
        label: key.slice(5),
        pv: entry?.pv ?? 0,
        uv: entry?.visitors.length ?? 0,
      })
    }
    return series
  })

  const uvSummary = computed(() => {
    if (remoteUv.value) {
      return {
        pv: remoteUv.value.pv,
        uv: remoteUv.value.uv,
        todayPv: remoteUv.value.todayPv,
        todayUv: remoteUv.value.todayUv,
        topPages: [] as { path: string; count: number }[],
        activeDays: remoteUv.value.activeDays,
      }
    }
    const days = Object.values(uv.value.days)
    const visitors = new Set<string>()
    let pv = 0
    const views: Record<string, number> = {}
    for (const entry of days) {
      pv += entry.pv
      entry.visitors.forEach((v) => visitors.add(v))
      for (const [path, count] of Object.entries(entry.views)) {
        views[path] = (views[path] ?? 0) + count
      }
    }
    const topPages = Object.entries(views)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path, count]) => ({ path, count }))
    return {
      pv,
      uv: visitors.size,
      todayPv: uv.value.days[today.value]?.pv ?? 0,
      todayUv: uv.value.days[today.value]?.visitors.length ?? 0,
      topPages,
      activeDays: days.filter((d) => d.pv > 0).length,
    }
  })

  return {
    checkin,
    checkedToday,
    streak,
    totalDays,
    badges,
    nextBadge,
    doCheckin,
    loadCheckin,
    loadUv,
    track,
    uvSeries,
    uvSummary,
    today,
  }
})
