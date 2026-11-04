<script setup lang="ts">
import { onMounted, ref } from 'vue'

const layers = ref<{ left: string; top: string; size: number; delay: string; duration: string }[]>([])

onMounted(() => {
  layers.value = [
    { left: '-8%', top: '6%', size: 520, delay: '0s', duration: '120s' },
    { left: '78%', top: '52%', size: 620, delay: '-30s', duration: '150s' },
    { left: '34%', top: '-14%', size: 380, delay: '-60s', duration: '96s' },
  ]
})
</script>

<template>
  <div class="bg-magic" aria-hidden="true">
    <div
      v-for="(layer, index) in layers"
      :key="index"
      class="seal"
      :style="{
        left: layer.left,
        top: layer.top,
        width: `${layer.size}px`,
        height: `${layer.size}px`,
        animationDelay: layer.delay,
        animationDuration: layer.duration,
      }"
    >
      <img src="/assets/megumin/magic-circle.png" alt="" />
    </div>
    <div class="beam"></div>
    <div class="vignette"></div>
  </div>
</template>

<style scoped>
.bg-magic {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.seal {
  position: absolute;
  opacity: 0.1;
  animation: spin linear infinite;
  will-change: transform;
}

.seal img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: screen;
  filter: drop-shadow(0 0 40px rgba(165, 42, 54, 0.5));
}

.beam {
  position: absolute;
  top: -30%;
  left: 42%;
  width: 46vw;
  height: 130vh;
  background: radial-gradient(closest-side, rgba(165, 42, 54, 0.14), transparent 70%);
  transform: rotate(16deg);
  filter: blur(20px);
}

.vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 90% at 50% 0%, transparent 40%, rgba(8, 6, 10, 0.55) 100%);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .seal {
    animation: none;
  }
}
</style>
