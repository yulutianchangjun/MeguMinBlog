<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { NConfigProvider, NMessageProvider, darkTheme, type GlobalThemeOverrides } from 'naive-ui'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import FireRain from '@/components/layout/FireRain.vue'
import LeftSidebar from '@/components/layout/LeftSidebar.vue'
import RightSidebar from '@/components/layout/RightSidebar.vue'
import LoginModal from '@/components/admin/LoginModal.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import { useInteractionStore } from '@/stores/interaction'
import { usePlayerStore } from '@/stores/player'
import { useProfileStore } from '@/stores/profile'
import { useSiteStore } from '@/stores/site'

const ui = useUiStore()
const auth = useAuthStore()
const content = useContentStore()
const interaction = useInteractionStore()
const player = usePlayerStore()
const profile = useProfileStore()
const siteStore = useSiteStore()
const route = useRoute()

/** 404 等沉浸页跳过三栏骨架，只保留 Header / Footer */
const bare = computed(() => route.meta.bare === true)

const overrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#A52A36',
    primaryColorHover: '#C73C4B',
    primaryColorPressed: '#7A2130',
    primaryColorSuppl: '#A52A36',
    bodyColor: '#17151C',
    cardColor: '#1E1A25',
    modalColor: '#1C1823',
    popoverColor: '#221C29',
    tableColor: '#1C1823',
    inputColor: '#151119',
    actionColor: '#241E2C',
    borderColor: 'rgba(217,172,88,0.2)',
    dividerColor: 'rgba(217,172,88,0.14)',
    textColorBase: '#E9DFD2',
    textColor1: '#F4EBDD',
    textColor2: '#CFC4B7',
    textColor3: '#9A8F86',
    placeholderColor: '#6F655E',
    errorColor: '#C73C4B',
    successColor: '#8FB49B',
    warningColor: '#D9AC58',
    infoColor: '#D9AC58',
    fontFamily: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
    borderRadius: '10px',
  },
  Button: {
    borderRadiusMedium: '999px',
    borderRadiusSmall: '999px',
    fontWeight: '500',
  },
  Input: { borderRadius: '10px' },
  Modal: { borderRadius: '18px' },
  Card: { borderRadius: '16px' },
  Drawer: { color: '#1A1621' },
  Tag: { borderRadius: '999px' },
  Tabs: {
    tabTextColorActiveLine: '#F2DBA6',
    tabTextColorHoverLine: '#D9AC58',
    barColor: '#D9AC58',
  },
}

function onKeydown(event: KeyboardEvent) {
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'l') {
    event.preventDefault()
    if (auth.isAdmin) {
      ui.adminOpen ? ui.closeAdmin() : ui.openAdmin('posts')
    } else {
      ui.openLogin()
    }
  }
  if (event.key === 'Escape') {
    ui.mobileNavOpen = false
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  await auth.restore()
  await Promise.allSettled([
    content.load(),
    interaction.load(),
    profile.loadCheckin(),
    siteStore.load(),
    player.load(),
  ])
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="overrides">
    <n-message-provider>
      <div class="app-root">
        <FireRain />
        <AppHeader />
        <div class="shell" :class="{ bare }">
          <div class="layout-grid" :class="{ bare }">
            <aside v-if="!bare" class="col-side left">
              <LeftSidebar />
            </aside>
            <main class="content" :class="{ bare }">
              <router-view v-slot="{ Component, route }">
                <transition name="page" mode="out-in">
                  <keep-alive :include="['PostsView']">
                    <component :is="Component" :key="route.path" />
                  </keep-alive>
                </transition>
              </router-view>
            </main>
            <aside v-if="!bare" class="col-side right right-sidebar-scroll">
              <RightSidebar />
            </aside>
          </div>
        </div>
        <AppFooter />
        <LoginModal />
        <AdminPanel />
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<style scoped>
.app-root {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.shell {
  flex: 1;
}

/* 全宽单栏骨架（404 等沉浸页） */
.shell.bare {
  max-width: none;
  width: 100%;
  padding: 0 var(--gutter) 24px;
  display: flex;
}

.layout-grid.bare {
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  padding-top: 0;
  width: 100%;
}

main.content.bare {
  min-height: calc(100vh - var(--header-h) - 186px);
  justify-content: center;
  gap: 0;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s var(--ease), transform 0.3s var(--ease), filter 0.3s var(--ease);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.995);
  filter: blur(2px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  filter: blur(2px);
}
</style>
