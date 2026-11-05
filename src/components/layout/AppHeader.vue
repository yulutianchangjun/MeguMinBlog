<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { site } from '@/data/site'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useProfileStore } from '@/stores/profile'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const profile = useProfileStore()
const scrolled = ref(false)

const nav = [
  { label: '首页', en: 'Home', path: '/', icon: 'home' },
  { label: '日常', en: 'Daily', path: '/posts', icon: 'book' },
  { label: '综集', en: 'Series', path: '/collections', icon: 'layers' },
  { label: '留言墙', en: 'Board', path: '/board', icon: 'pin' },
  { label: '关于', en: 'About', path: '/about', icon: 'user' },
]

const isActive = (path: string) =>
  path === '/' ? route.path === '/' : route.path.startsWith(path)

const todayUv = computed(() => profile.uvSummary.todayUv)

function go(path: string) {
  ui.mobileNavOpen = false
  router.push(path)
}

function quickSearch() {
  router.push({ path: '/posts', query: { focus: '1' } })
}

function handleScroll() {
  scrolled.value = window.scrollY > 12
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => window.removeEventListener('scroll', handleScroll))
</script>

<template>
  <header class="app-header" :class="{ scrolled }">
    <div class="header-inner">
      <router-link to="/" class="brand" aria-label="返回首页">
        <span class="sigil">
          <img src="/assets/megumin/logo.png" :alt="`${site.title} LOGO`" />
        </span>
        <span class="brand-text">
          <strong>{{ site.title }}</strong>
          <em>{{ site.subtitle }}</em>
        </span>
      </router-link>

      <nav class="nav" aria-label="主导航">
        <router-link
          v-for="item in nav"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: isActive(item.path) }"
        >
          <MagicIcon :name="item.icon" :size="15" />
          <span>{{ item.label }}</span>
          <em>{{ item.en }}</em>
        </router-link>
      </nav>

      <div class="actions">
        <span class="visitors" :title="`今日独立访客 ${todayUv}`">
          <span class="pulse"></span>
          <MagicIcon name="eye" :size="14" />
          <span class="num">{{ String(todayUv).padStart(2, '0') }}</span>
        </span>
        <button class="icon-btn" title="检索手记" @click="quickSearch">
          <MagicIcon name="search" :size="17" />
        </button>
        <template v-if="auth.isAdmin">
          <button class="icon-btn admin" title="管理面板（Ctrl+Shift+L）" @click="ui.openAdmin('posts')">
            <MagicIcon name="shield" :size="17" />
          </button>
          <button class="icon-btn" title="退出登录" @click="auth.logout()">
            <MagicIcon name="logout" :size="17" />
          </button>
        </template>
        <button class="icon-btn mobile-only" title="菜单" @click="ui.mobileNavOpen = !ui.mobileNavOpen">
          <MagicIcon :name="ui.mobileNavOpen ? 'close' : 'menu'" :size="18" />
        </button>
      </div>
    </div>

    <transition name="drop">
      <nav v-if="ui.mobileNavOpen" class="mobile-nav">
        <button
          v-for="item in nav"
          :key="item.path"
          class="mobile-link"
          :class="{ active: isActive(item.path) }"
          @click="go(item.path)"
        >
          <MagicIcon :name="item.icon" :size="16" />
          <span>{{ item.label }}</span>
          <em>{{ item.en }}</em>
        </button>
        <div class="mobile-foot">
          <span>今日来访 {{ todayUv }}</span>
          <button v-if="auth.isAdmin" class="btn-magic ghost" @click="ui.openAdmin('posts')">管理面板</button>
        </div>
      </nav>
    </transition>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 60;
  transition: background 0.35s var(--ease), box-shadow 0.35s var(--ease), border-color 0.35s var(--ease);
  border-bottom: 1px solid rgba(217, 172, 88, 0.12);
  background: linear-gradient(180deg, rgba(19, 16, 23, 0.9), rgba(19, 16, 23, 0.62));
  backdrop-filter: blur(6px) saturate(1.05);
}

.app-header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(217, 172, 88, 0.45), transparent);
  opacity: 0.6;
}

.app-header.scrolled {
  background: rgba(16, 13, 19, 0.94);
  box-shadow: 0 18px 40px -30px #000;
}

.header-inner {
  max-width: var(--max-w);
  height: var(--header-h);
  margin: 0 auto;
  padding: 0 var(--gutter);
  display: flex;
  align-items: center;
  gap: 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
}

.sigil {
  position: relative;
  width: 48px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.sigil img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 12px rgba(217, 172, 88, 0.18));
  transition: transform 0.3s var(--ease);
}

.brand:hover .sigil img {
  transform: translateY(-1px) scale(1.03);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-text strong {
  font-family: var(--font-display);
  font-size: 17px;
  letter-spacing: 0.08em;
  color: var(--c-paper);
}

.brand-text em {
  font-family: var(--font-display);
  font-style: normal;
  font-size: 9.5px;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--c-gold);
  opacity: 0.75;
}

.nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 auto;
}

.nav-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 15px;
  border-radius: 999px;
  color: var(--c-text-2);
  font-size: 13.5px;
  letter-spacing: 0.04em;
  transition: all 0.25s var(--ease);
}

.nav-link em {
  font-family: var(--font-display);
  font-style: normal;
  font-size: 8.5px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  opacity: 0.35;
}

.nav-link:hover {
  color: var(--c-gold-2);
  background: rgba(217, 172, 88, 0.06);
}

.nav-link.active {
  color: #fff4e3;
  background: linear-gradient(140deg, rgba(165, 42, 54, 0.42), rgba(100, 28, 43, 0.16));
  box-shadow: inset 0 0 0 1px rgba(217, 172, 88, 0.28);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 3px;
  width: 16px;
  height: 2px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, transparent, var(--c-gold), transparent);
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

.visitors {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.16);
  background: rgba(20, 16, 25, 0.6);
  color: var(--c-text-2);
  font-family: var(--font-mono);
  font-size: 11.5px;
}

.visitors .num {
  color: var(--c-gold-2);
  letter-spacing: 0.1em;
}

.pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #b8443f;
  box-shadow: 0 0 0 0 rgba(199, 60, 75, 0.6);
  animation: pulse 2.4s infinite;
}

.icon-btn {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.16);
  background: rgba(28, 23, 35, 0.6);
  color: var(--c-text-2);
  cursor: pointer;
  transition: all 0.24s var(--ease);
}

.icon-btn:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.45);
  transform: translateY(-1px);
}

.icon-btn.admin {
  color: var(--c-gold);
  border-color: rgba(217, 172, 88, 0.4);
}

.mobile-only {
  display: none;
}

.mobile-nav {
  display: none;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(199, 60, 75, 0.55);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(199, 60, 75, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(199, 60, 75, 0);
  }
}

@media (max-width: 1100px) {
  .nav-link em {
    display: none;
  }
  .nav-link {
    padding: 9px 11px;
  }
}

@media (max-width: 900px) {
  .nav {
    display: none;
  }
  .mobile-only {
    display: grid;
  }
  .header-inner {
    justify-content: space-between;
  }
  .visitors {
    display: none;
  }
  .mobile-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px var(--gutter) 18px;
    border-top: 1px solid rgba(217, 172, 88, 0.12);
    background: rgba(16, 13, 19, 0.98);
  }
  .mobile-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--c-text-2);
    font-size: 14px;
    cursor: pointer;
  }
  .mobile-link em {
    margin-left: auto;
    font-family: var(--font-display);
    font-style: normal;
    font-size: 9px;
    letter-spacing: 0.2em;
    opacity: 0.4;
  }
  .mobile-link.active {
    color: var(--c-gold-2);
    background: rgba(165, 42, 54, 0.18);
    border-color: rgba(217, 172, 88, 0.24);
  }
  .mobile-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px dashed rgba(217, 172, 88, 0.16);
    font-size: 12px;
    color: var(--c-muted);
  }
  .brand-text strong {
    font-size: 15px;
  }
  .brand-text em {
    font-size: 8.5px;
  }
}

.drop-enter-active,
.drop-leave-active {
  transition: opacity 0.22s var(--ease), transform 0.22s var(--ease);
}

.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
