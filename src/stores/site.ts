import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminApi, publicApi, type ApiAnniversary } from '@/api'
import { apiReady } from '@/lib/http'

export interface SiteAnniversary {
  id: number
  label: string
  /** MM-DD，每年循环 */
  date: string
  note: string
  sort: number
}

function mapAnniversary(source: ApiAnniversary): SiteAnniversary {
  return {
    id: source.id,
    label: source.label,
    date: source.date,
    note: source.note ?? '',
    sort: source.sort,
  }
}

/**
 * 站点动态信息（全部来自后端）：
 * - 开站日期（「开站第 N 天」、关于页时间线）
 * - 纪念日倒计时（右侧栏 + 日历节日标记）
 */
export const useSiteStore = defineStore('site', () => {
  const startDate = ref('')
  const anniversaries = ref<SiteAnniversary[]>([])
  const loaded = ref(false)
  const error = ref('')

  async function load(): Promise<void> {
    if (!apiReady || loaded.value) {
      if (!apiReady) loaded.value = true
      return
    }
    error.value = ''
    try {
      const info = await publicApi.site()
      startDate.value = info.startDate
      anniversaries.value = info.anniversaries.map(mapAnniversary)
      loaded.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '站点信息加载失败'
    }
  }

  async function reload(): Promise<void> {
    loaded.value = false
    await load()
  }

  async function saveAnniversary(item: SiteAnniversary, isNew: boolean): Promise<void> {
    const payload = {
      label: item.label,
      date: item.date,
      note: item.note || undefined,
      sort: item.sort,
    }
    if (isNew) await adminApi.createAnniversary(payload)
    else await adminApi.updateAnniversary(item.id, payload)
    await reload()
  }

  async function deleteAnniversary(id: number): Promise<void> {
    await adminApi.deleteAnniversary(id)
    await reload()
  }

  async function saveStartDate(value: string): Promise<void> {
    await adminApi.updateStartDate(value)
    startDate.value = value
  }

  return {
    startDate,
    anniversaries,
    loaded,
    error,
    load,
    reload,
    saveAnniversary,
    deleteAnniversary,
    saveStartDate,
  }
})
