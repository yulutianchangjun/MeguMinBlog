import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { adminApi, publicApi, type ApiCheckin, type ApiUv } from '@/api'
import { apiReady } from '@/lib/http'

/**
 * 博主动态数据：签到记录与浏览踪迹（PV/UV）全部来自后端。
 * - 签到：MySQL blog_checkin（连续天数按 Asia/Shanghai 计算）
 * - 踪迹：Redis 统计（保留 120 天），后端不可用时一律显示为 0
 */
export const useProfileStore = defineStore('profile', () => {
  const remoteCheckin = ref<ApiCheckin | null>(null)
  const remoteUv = ref<ApiUv | null>(null)
  const loading = ref(false)

  const checkedToday = computed(() => remoteCheckin.value?.checkedToday ?? false)
  const streak = computed(() => remoteCheckin.value?.streak ?? 0)
  const totalDays = computed(() => remoteCheckin.value?.total ?? 0)

  /** 签到日历（含全部历史日期），后端返回 */
  const checkinDates = computed<string[]>(() => remoteCheckin.value?.dates ?? [])

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
    if (!apiReady) {
      return { ok: false, streak: streak.value, message: '未连接后端，无法签到' }
    }
    try {
      remoteCheckin.value = await adminApi.checkin()
      return { ok: true, streak: remoteCheckin.value.streak }
    } catch (err) {
      return { ok: false, streak: streak.value, message: err instanceof Error ? err.message : '签到失败' }
    }
  }

  async function loadCheckin(): Promise<void> {
    if (!apiReady) return
    loading.value = true
    try {
      remoteCheckin.value = await publicApi.checkin()
    } catch {
      remoteCheckin.value = null
    } finally {
      loading.value = false
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

  /** 浏览踪迹上报（fire-and-forget，仅发给后端 Redis 统计） */
  function track(path: string) {
    if (!apiReady) return
    const slug = path.startsWith('/posts/') ? path.slice('/posts/'.length) : undefined
    void publicApi.track(path, slug).catch(() => undefined)
  }

  const uvSeries = computed(() => remoteUv.value?.series ?? [])

  const uvSummary = computed(() => {
    if (remoteUv.value) {
      return {
        pv: remoteUv.value.pv,
        uv: remoteUv.value.uv,
        todayPv: remoteUv.value.todayPv,
        todayUv: remoteUv.value.todayUv,
        topPages: remoteUv.value.topPages ?? [],
        activeDays: remoteUv.value.activeDays,
      }
    }
    return { pv: 0, uv: 0, todayPv: 0, todayUv: 0, topPages: [], activeDays: 0 }
  })

  return {
    loading,
    checkedToday,
    streak,
    totalDays,
    checkinDates,
    badges,
    nextBadge,
    doCheckin,
    loadCheckin,
    loadUv,
    track,
    uvSeries,
    uvSummary,
  }
})
