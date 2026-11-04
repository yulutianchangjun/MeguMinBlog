<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CalendarPanel from '@/components/widgets/CalendarPanel.vue'
import CountdownPanel from '@/components/widgets/CountdownPanel.vue'
import TableOfContents from '@/components/widgets/TableOfContents.vue'

const route = useRoute()
const isPost = computed(() => route.name === 'post')
</script>

<template>
  <transition name="swap" mode="out-in">
    <div v-if="isPost" key="toc" class="side-stack">
      <TableOfContents />
    </div>
    <div v-else key="calendar" class="side-stack">
      <CalendarPanel />
      <CountdownPanel />
    </div>
  </transition>
</template>

<style scoped>
.side-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.swap-enter-active,
.swap-leave-active {
  transition: opacity 0.32s var(--ease), transform 0.32s var(--ease), filter 0.32s var(--ease);
}

.swap-enter-from {
  opacity: 0;
  transform: translateX(14px) scale(0.985);
  filter: blur(3px);
}

.swap-leave-to {
  opacity: 0;
  transform: translateX(-12px) scale(0.99);
  filter: blur(3px);
}
</style>
