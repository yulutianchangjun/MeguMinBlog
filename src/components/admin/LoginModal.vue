<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NModal } from 'naive-ui'
import MagicIcon from '@/components/common/MagicIcon.vue'
import RuneSeal from '@/components/common/RuneSeal.vue'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()

const show = computed({
  get: () => ui.loginOpen,
  set: (value: boolean) => (value ? ui.openLogin() : ui.closeLogin()),
})

const mode = ref<'pat' | 'pass'>('pat')
const token = ref('')
const passphrase = ref('')

watch(
  () => ui.loginOpen,
  (open) => {
    if (open) {
      auth.error = ''
      token.value = ''
      passphrase.value = ''
    }
  },
)

async function submitPat() {
  if (!token.value.trim()) {
    toast.warning('请先填入 GitHub 令牌')
    return
  }
  const ok = await auth.loginWithPat(token.value)
  if (ok) {
    ui.closeLogin()
    ui.openAdmin('posts')
    toast.success('身份已验证，欢迎回来')
  }
}

function submitPass() {
  if (!passphrase.value.trim()) {
    toast.warning('口令不能为空')
    return
  }
  if (auth.loginWithPassphrase(passphrase.value)) {
    ui.closeLogin()
    ui.openAdmin('posts')
    toast.success('口令正确，暗门已开')
  }
}
</script>

<template>
  <n-modal v-model:show="show" :mask-closable="true" transform-origin="center">
    <div class="login-card mage-card">
      <RuneSeal class="seal" :size="260" :opacity="0.2" :duration="60" />
      <button class="close" aria-label="关闭" @click="ui.closeLogin()">
        <MagicIcon name="close" :size="14" />
      </button>

      <div class="head">
        <span class="badge"><MagicIcon name="lock" :size="14" /></span>
        <span class="eyebrow">Restricted · 暗门</span>
        <h2>推开这扇门</h2>
        <p>只有博主可以进入。访客请继续浏览，这里没有你需要的东西。</p>
      </div>

      <div class="tabs">
        <button class="tab" :class="{ active: mode === 'pat' }" @click="mode = 'pat'">
          <MagicIcon name="github" :size="13" />
          GitHub 令牌
        </button>
        <button class="tab" :class="{ active: mode === 'pass' }" @click="mode = 'pass'">
          <MagicIcon name="wand" :size="13" />
          离线口令
        </button>
      </div>

      <form v-if="mode === 'pat'" class="form" @submit.prevent="submitPat">
        <label class="field">
          <span>Personal Access Token</span>
          <input
            v-model="token"
            type="password"
            autocomplete="off"
            placeholder="ghp_…"
            spellcheck="false"
          />
        </label>
        <p class="tip">
          需要在 GitHub 创建一枚只读 <code>read:user</code> 权限的令牌，用于确认你是博主本人。
          令牌不会上传到任何服务器，仅保存在本次会话中。
        </p>
        <p v-if="auth.error" class="error">{{ auth.error }}</p>
        <button type="submit" class="btn-magic full" :disabled="auth.loading">
          <MagicIcon name="shield" :size="14" />
          {{ auth.loading ? '正在校验…' : '验证身份' }}
        </button>
      </form>

      <form v-else class="form" @submit.prevent="submitPass">
        <label class="field">
          <span>暗门口令</span>
          <input
            v-model="passphrase"
            type="password"
            autocomplete="off"
            placeholder="一句咏唱的最后一个词…"
            spellcheck="false"
          />
        </label>
        <p class="tip">
          离线模式：当无法连接 GitHub 时使用。提示——那位魔法使每次施法结束时都会喊的那个词。
        </p>
        <p v-if="auth.error" class="error">{{ auth.error }}</p>
        <button type="submit" class="btn-magic full">
          <MagicIcon name="flame" :size="14" />
          开门
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
  width: min(92vw, 430px);
  padding: 26px 26px 18px;
  overflow: hidden;
  border-color: rgba(217, 172, 88, 0.32);
  background:
    radial-gradient(120% 100% at 88% 0%, rgba(165, 42, 54, 0.3), transparent 58%),
    linear-gradient(160deg, #2b2231 0%, #1b1621 52%, #141019 100%);
  box-shadow: 0 40px 80px -40px #000, 0 0 0 1px rgba(217, 172, 88, 0.08);
}

.seal {
  position: absolute;
  right: -90px;
  top: -80px;
  mix-blend-mode: screen;
  pointer-events: none;
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
  margin-bottom: 18px;
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
  font-size: 12px;
  line-height: 1.8;
  color: var(--c-muted);
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.14);
  background: rgba(14, 11, 19, 0.6);
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
}

.tab {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: var(--c-text-2);
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.24s var(--ease);
}

.tab.active {
  color: #fff3e0;
  background: linear-gradient(150deg, rgba(165, 42, 54, 0.8), rgba(100, 28, 43, 0.5));
  box-shadow: inset 0 0 0 1px rgba(217, 172, 88, 0.24);
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
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
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
  letter-spacing: 0.06em;
  outline: none;
  transition: all 0.24s var(--ease);
}

.field input:focus {
  border-color: rgba(217, 172, 88, 0.55);
  box-shadow: 0 0 0 3px rgba(165, 42, 54, 0.16);
}

.tip {
  margin: 0;
  font-size: 10.5px;
  line-height: 1.8;
  color: var(--c-muted);
}

.tip code {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(217, 172, 88, 0.1);
  color: var(--c-gold-2);
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
