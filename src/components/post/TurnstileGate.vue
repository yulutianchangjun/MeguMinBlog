<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import MagicIcon from '@/components/common/MagicIcon.vue'

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

const isDev = import.meta.env.DEV
const host = ref<HTMLElement | null>(null)
const state = ref<'loading' | 'ready' | 'passed' | 'failed'>('loading')
const message = ref('')
let widgetId = ''

async function mountWidget() {
  if (!props.siteKey) return
  state.value = 'loading'
  message.value = ''
  try {
    await loadTurnstile()
    if (!host.value || !window.turnstile) throw new Error('Turnstile 未就绪')
    if (widgetId) {
      window.turnstile.remove(widgetId)
      widgetId = ''
    }
    widgetId = window.turnstile.render(host.value, {
      sitekey: props.siteKey,
      theme: 'dark',
      language: 'zh-CN',
      appearance: 'always',
      size: 'normal',
      callback: (token: string) => {
        state.value = 'passed'
        message.value = ''
        emit('verified', token)
      },
      'expired-callback': () => {
        state.value = 'ready'
        message.value = '校验已过期，请重新勾选'
      },
      'error-callback': () => {
        state.value = 'failed'
        message.value = '校验组件报错，可能是域名未在 Cloudflare 白名单中'
      },
      'timeout-callback': () => {
        state.value = 'ready'
        message.value = '校验超时，请重试'
      },
    })
    state.value = 'ready'
  } catch (error) {
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : '校验组件加载失败'
  }
}

function skipForLocalPreview() {
  state.value = 'passed'
  emit('verified', '')
}

onMounted(mountWidget)

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
  <div class="gate" :class="state">
    <div class="head">
      <span class="badge"><MagicIcon name="shield" :size="14" /></span>
      <div>
        <strong>发言前先过一道 Turnstile</strong>
        <p>Cloudflare 会做一次无感校验，用来挡住脚本刷评论。</p>
      </div>
      <span v-if="state === 'passed'" class="passed-tag">
        <MagicIcon name="check" :size="11" />
        已通过
      </span>
    </div>

    <div ref="host" class="widget"></div>

    <p v-if="message" class="msg">{{ message }}</p>

    <div class="actions">
      <button v-if="state === 'failed'" class="mini-btn" @click="mountWidget">
        <MagicIcon name="refresh" :size="11" />
        重试
      </button>
      <button v-if="state === 'failed' && isDev" class="mini-btn ghost" @click="skipForLocalPreview">
        本地预览：跳过校验
      </button>
    </div>
  </div>
</template>

<style scoped>
.gate {
  margin: 0 14px 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px dashed rgba(217, 172, 88, 0.2);
  background:
    radial-gradient(120% 100% at 12% 0%, rgba(165, 42, 54, 0.12), transparent 60%),
    rgba(12, 9, 16, 0.45);
}

.gate.passed {
  border-style: solid;
  border-color: rgba(143, 180, 155, 0.35);
  background: rgba(143, 180, 155, 0.06);
}

.head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.badge {
  width: 30px;
  height: 30px;
  flex: none;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.3);
  background: rgba(165, 42, 54, 0.16);
  color: var(--c-gold-2);
}

.head strong {
  display: block;
  font-family: var(--font-display);
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--c-paper);
}

.head p {
  margin: 3px 0 0;
  font-size: 10px;
  line-height: 1.7;
  color: var(--c-muted);
}

.passed-tag {
  margin-left: auto;
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(143, 180, 155, 0.4);
  background: rgba(143, 180, 155, 0.12);
  color: #a9d0b8;
  font-size: 9.5px;
}

.widget {
  margin-top: 10px;
  min-height: 66px;
}

.msg {
  margin: 8px 0 0;
  font-size: 10px;
  line-height: 1.6;
  color: #ffc4cc;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.mini-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 11px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.3);
  background: rgba(165, 42, 54, 0.22);
  color: var(--c-gold-2);
  font-size: 10.5px;
  cursor: pointer;
}

.mini-btn.ghost {
  background: transparent;
  border-color: rgba(217, 172, 88, 0.16);
  color: var(--c-muted);
}
</style>
