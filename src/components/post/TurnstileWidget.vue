<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{ siteKey: string }>()
const emit = defineEmits<{ verified: [token: string] }>()

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string
  reset: (id?: string) => void
  remove: (id?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<void> | null = null

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Turnstile 脚本加载失败'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

const host = ref<HTMLElement | null>(null)
const message = ref('')
const ready = ref(false)
let widgetId = ''

async function mount() {
  if (!props.siteKey) {
    ready.value = true
    return
  }
  try {
    await loadTurnstile()
    if (!host.value || !window.turnstile) throw new Error('Turnstile 未就绪')
    if (widgetId) window.turnstile.remove(widgetId)
    widgetId = window.turnstile.render(host.value, {
      sitekey: props.siteKey,
      theme: 'dark',
      language: 'zh-CN',
      appearance: 'always',
      size: 'flexible',
      callback: (token: string) => {
        ready.value = true
        message.value = ''
        emit('verified', token)
      },
      'expired-callback': () => {
        ready.value = false
        message.value = '校验过期，请重新勾选'
        emit('verified', '')
      },
      'error-callback': () => {
        ready.value = false
        message.value = '校验组件加载失败，请检查域名白名单'
      },
    })
  } catch (error) {
    message.value = error instanceof Error ? error.message : '校验组件加载失败'
  }
}

function reset() {
  ready.value = false
  message.value = ''
  emit('verified', '')
  if (widgetId && window.turnstile) window.turnstile.reset(widgetId)
}

defineExpose({ reset })

onMounted(mount)

onBeforeUnmount(() => {
  if (widgetId && window.turnstile) {
    try {
      window.turnstile.remove(widgetId)
    } catch {
      /* noop */
    }
  }
})
</script>

<template>
  <div v-if="siteKey" class="turnstile">
    <div ref="host" class="widget"></div>
    <p v-if="message" class="msg">{{ message }}</p>
  </div>
</template>

<style scoped>
.turnstile {
  margin-top: 2px;
}

.widget {
  min-height: 65px;
}

.msg {
  margin: 4px 0 0;
  font-size: 9.5px;
  line-height: 1.6;
  color: #ffc4cc;
}
</style>
