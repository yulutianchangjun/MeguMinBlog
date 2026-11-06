<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NModal } from 'naive-ui'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { API_BASE, apiReady } from '@/lib/http'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()

const show = computed({
  get: () => ui.loginOpen,
  set: (value: boolean) => (value ? ui.openLogin() : ui.closeLogin()),
})

const username = ref('')
const password = ref('')

watch(
  () => ui.loginOpen,
  (open) => {
    if (open) {
      auth.error = ''
      username.value = ''
      password.value = ''
    }
  },
)

async function submit() {
  if (!username.value.trim() || !password.value) {
    toast.warning('请输入账号与密码')
    return
  }
  const ok = await auth.loginWithPassword(username.value, password.value)
  if (ok) {
    password.value = ''
    ui.closeLogin()
    ui.openAdmin('posts')
    toast.success(`欢迎回来，${auth.user?.nickname || auth.login}`)
  }
}
</script>

<template>
  <n-modal v-model:show="show" :mask-closable="true" transform-origin="center">
    <div class="login-card mage-card">
      <button class="close" aria-label="关闭" @click="ui.closeLogin()">
        <MagicIcon name="close" :size="14" />
      </button>

      <div class="head">
        <span class="badge"><MagicIcon name="shield" :size="15" /></span>
        <span class="eyebrow">Owner Only · 博主登录</span>
        <h2>推开这扇门</h2>
      </div>

      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span>账号</span>
          <input v-model="username" autocomplete="username" placeholder="请输入账号" spellcheck="false" />
        </label>
        <label class="field">
          <span>密码</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
          />
        </label>

        <p v-if="auth.error" class="error">{{ auth.error }}</p>

        <button type="submit" class="btn-magic full" :disabled="auth.loading || !apiReady">
          <MagicIcon name="lock" :size="14" />
          {{ auth.loading ? '正在校验…' : '登录后台' }}
        </button>
      </form>

      <div class="foot">
        <MagicIcon name="spark" :size="11" />
        连续点击头像 5 次也可以唤起这里
      </div>
    </div>
  </n-modal>
</template>

<style scoped>
.login-card {
  position: relative;
  width: min(92vw, 420px);
  padding: 26px 26px 18px;
  overflow: hidden;
  border-color: rgba(217, 172, 88, 0.32);
  background:
    radial-gradient(120% 100% at 88% 0%, rgba(165, 42, 54, 0.3), transparent 58%),
    linear-gradient(160deg, #2b2231 0%, #1b1621 52%, #141019 100%);
  box-shadow: 0 40px 80px -40px #000, 0 0 0 1px rgba(217, 172, 88, 0.08);
}

.close {
  position: absolute;
  right: 12px;
  top: 12px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.2);
  background: rgba(16, 12, 20, 0.6);
  color: var(--c-text-2);
  cursor: pointer;
  z-index: 2;
}

.close:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.5);
}

.head {
  position: relative;
  z-index: 1;
  margin-bottom: 14px;
}

.badge {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.4);
  background: radial-gradient(circle, rgba(165, 42, 54, 0.5), rgba(20, 15, 26, 0.8));
  color: var(--c-gold-2);
  margin-bottom: 12px;
}

.head h2 {
  margin: 6px 0 6px;
  font-size: 24px;
  letter-spacing: 0.06em;
}

.head p {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.8;
  color: var(--c-muted);
}

.head code {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(217, 172, 88, 0.1);
  color: var(--c-gold-2);
}

.server-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
  padding: 8px 12px;
  border-radius: 9px;
  border: 1px dashed rgba(217, 172, 88, 0.22);
  background: rgba(217, 172, 88, 0.05);
  font-size: 10.5px;
  color: var(--c-muted);
}

.server-row strong {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--c-gold-2);
  word-break: break-all;
  text-align: right;
}

.server-row.off strong {
  color: #ffc4cc;
}

.form {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span {
  font-size: 9.5px;
  letter-spacing: 0.08em;
  color: var(--c-gold);
}

.field input {
  padding: 10px 13px;
  border-radius: 9px;
  border: 1px solid rgba(217, 172, 88, 0.2);
  background: rgba(12, 9, 16, 0.75);
  color: var(--c-text);
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.04em;
  outline: none;
  transition: all 0.24s var(--c-ease, ease);
}

.field input:focus {
  border-color: rgba(217, 172, 88, 0.55);
  box-shadow: 0 0 0 3px rgba(165, 42, 54, 0.16);
}

.error {
  margin: 0;
  padding: 7px 10px;
  border-radius: 7px;
  border: 1px solid rgba(199, 60, 75, 0.4);
  background: rgba(165, 42, 54, 0.16);
  color: #ffb3bd;
  font-size: 11px;
  line-height: 1.6;
}

.btn-magic.full {
  width: 100%;
  padding: 10px;
  margin-top: 2px;
}

.btn-magic.full:disabled {
  opacity: 0.6;
  cursor: default;
}

.foot {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed rgba(217, 172, 88, 0.16);
  font-size: 9.5px;
  color: rgba(139, 128, 120, 0.8);
}
</style>
