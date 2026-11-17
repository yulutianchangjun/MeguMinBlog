<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import MagicIcon from '@/components/common/MagicIcon.vue'

const props = defineProps<{ src: string; alt?: string }>()
const emit = defineEmits<{ close: [] }>()

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.src,
  (value) => {
    if (value) {
      document.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div v-if="src" class="lightbox" role="dialog" aria-modal="true" @click.self="emit('close')">
        <button class="close" aria-label="关闭预览" @click="emit('close')">
          <MagicIcon name="close" :size="16" />
        </button>
        <figure class="frame">
          <img :src="src" :alt="alt || '图片预览'" />
          <figcaption v-if="alt">{{ alt }}</figcaption>
        </figure>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4vh 4vw;
  background: rgba(8, 6, 11, 0.88);
  backdrop-filter: blur(6px);
  cursor: zoom-out;
}

.frame {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 100%;
  max-height: 100%;
}

.frame img {
  max-width: 100%;
  max-height: 84vh;
  object-fit: contain;
  border-radius: 10px;
  border: 1px solid rgba(217, 172, 88, 0.24);
  box-shadow: 0 30px 80px -30px #000;
  cursor: default;
}

.frame figcaption {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--c-text-3);
}

.close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.28);
  background: rgba(20, 16, 26, 0.9);
  color: var(--c-text-2);
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.close:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.6);
}

.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.22s var(--ease);
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
</style>
