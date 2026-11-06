import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TocItem } from '@/lib/markdown'

export const useReadingStore = defineStore('reading', () => {
  const toc = ref<TocItem[]>([])
  const activeId = ref('')
  const progress = ref(0)

  function setToc(items: TocItem[]) {
    toc.value = items
    activeId.value = items[0]?.id ?? ''
  }

  function clear() {
    toc.value = []
    activeId.value = ''
    progress.value = 0
  }

  return { toc, activeId, progress, setToc, clear }
})
