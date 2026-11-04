import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
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

  if (!visitorId.value) {
    visitorId.value = uid('v-')
    writeJSON('visitor-id', visitorId.value)
  }

  const checkedToday = computed(() => checkin.value.dates.includes(today.value))

  const streak = computed(() => {
    const set = new Set(checkin.value.dates)
    let cursor = set.has(today.value) ? today.value : shiftDay(today.value, -1)
    let count = 0
    while (set.has(cursor)) {
      count += 1
      cursor = shiftDay(cursor, -1)
    }
    return count
  })

  const totalDays = computed(() => checkin.value.total || checkin.value.dates.length)

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

  function doCheckin(): { ok: boolean; streak: number } {
    if (checkedToday.value) return { ok: false, streak: streak.value }
    checkin.value = {
      dates: [...checkin.value.dates, today.value],
      total: checkin.value.total + 1,
    }
    writeJSON('checkin', checkin.value)
    return { ok: true, streak: streak.value }
  }

  function track(path: string) {
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
    track,
    uvSeries,
    uvSummary,
    today,
  }
})
