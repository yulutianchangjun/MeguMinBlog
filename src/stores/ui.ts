import { defineStore } from 'pinia'
import { ref } from 'vue'

export type AdminTab = 'posts' | 'collections' | 'comments' | 'site' | 'data' | 'stats'

export const useUiStore = defineStore('ui', () => {
  const loginOpen = ref(false)
  const adminOpen = ref(false)
  const adminTab = ref<AdminTab>('posts')
  const mobileNavOpen = ref(false)

  function openLogin() {
    if (!loginOpen.value) loginOpen.value = true
  }
  function closeLogin() {
    loginOpen.value = false
  }
  function openAdmin(tab: AdminTab = 'posts') {
    adminTab.value = tab
    adminOpen.value = true
  }
  function closeAdmin() {
    adminOpen.value = false
  }

  return {
    loginOpen,
    adminOpen,
    adminTab,
    mobileNavOpen,
    openLogin,
    closeLogin,
    openAdmin,
    closeAdmin,
  }
})
