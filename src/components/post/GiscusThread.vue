<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { site } from '@/data/site'

const props = defineProps<{ term: string }>()
const emit = defineEmits<{ count: [value: number] }>()

const host = ref<HTMLElement | null>(null)
const loading = ref(true)
const failed = ref(false)
let script: HTMLScriptElement | null = null
let observer: MutationObserver | null = null

function onMessage(event: MessageEvent) {
  if (event.origin !== 'https://giscus.app') return
  const payload = event.data as { giscus?: { totalCommentCount?: number } } | null
  const total = payload?.giscus?.totalCommentCount
  if (typeof total === 'number') emit('count', total)
}

function mount() {
  const target = host.value
  if (!target) return
  target.innerHTML = ''
  failed.value = false
  loading.value = true

  script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'
  const attrs: Record<string, string> = {
    'data-repo': site.comments.repo,
    'data-repo-id': site.comments.repoId,
    'data-category': site.comments.category,
    'data-category-id': site.comments.categoryId,
    'data-mapping': site.comments.mapping,
    'data-term': props.term,
    'data-strict': site.comments.strict ? '1' : '0',
    'data-reactions-enabled': site.comments.reactionsEnabled ? '1' : '0',
    'data-emit-metadata': '1',
    'data-input-position': site.comments.inputPosition,
    'data-theme': site.comments.theme,
    'data-lang': site.comments.lang,
    'data-loading': 'lazy',
  }
  for (const [key, value] of Object.entries(attrs)) script.setAttribute(key, value)
  script.onerror = () => {
    loading.value = false
    failed.value = true
  }

  target.appendChild(script)

  // giscus 脚本会异步插入 iframe，观察到后结束骨架屏
  observer = new MutationObserver(() => {
    if (target.querySelector('iframe.giscus-frame')) {
      loading.value = false
      observer?.disconnect()
    }
  })
  observer.observe(target, { childList: true, subtree: true })
  window.setTimeout(() => (loading.value = false), 6000)
}

onMounted(() => {
  window.addEventListener('message', onMessage)
  mount()
})

onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
  observer?.disconnect()
  script?.remove()
  if (host.value) host.value.innerHTML = ''
})

function retry() {
  mount()
}
</script>

<template>
  <div class="giscus-wrap">
    <div v-if="loading" class="skeleton" aria-live="polite">
      <span class="bar w1"></span>
      <span class="bar w2"></span>
      <span class="bar w3"></span>
      <em>正在连上 GitHub Discussions…</em>
    </div>

    <div v-if="failed" class="failed">
      <p>评论组件加载失败，可能是网络无法访问 giscus.app。</p>
      <button class="btn-magic ghost small" @click="retry">重试</button>
    </div>

    <div ref="host" class="giscus-host"></div>
  </div>
</template>

<style scoped>
.giscus-wrap {
  position: relative;
  padding: 4px 14px 14px;
}

.giscus-host {
  min-height: 120px;
}

.skeleton {
  position: absolute;
  inset: 4px 14px 14px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 14px;
  border-radius: 10px;
  border: 1px dashed rgba(217, 172, 88, 0.14);
  background: rgba(12, 9, 16, 0.4);
}

.bar {
  height: 10px;
  border-radius: 99px;
  background: linear-gradient(90deg, rgba(217, 172, 88, 0.08), rgba(165, 42, 54, 0.18), rgba(217, 172, 88, 0.08));
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.w1 { width: 46%; }
.w2 { width: 88%; }
.w3 { width: 64%; }

.skeleton em {
  margin-top: 4px;
  font-style: normal;
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--c-muted);
}

.failed {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
  padding: 10px 12px;
  border-radius: 9px;
  border: 1px solid rgba(199, 60, 75, 0.35);
  background: rgba(165, 42, 54, 0.12);
}

.failed p {
  margin: 0;
  font-size: 11px;
  color: #ffc4cc;
}

.small {
  padding: 5px 12px;
  font-size: 11px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
