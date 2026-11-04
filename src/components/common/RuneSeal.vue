<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
    duration?: number
    opacity?: number
    reverse?: boolean
    color?: boolean
  }>(),
  { size: 420, duration: 64, opacity: 0.22, reverse: false, color: false },
)
</script>

<template>
  <div
    class="rune-seal"
    :class="{ reverse, color }"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      opacity,
      animationDuration: `${duration}s`,
    }"
    aria-hidden="true"
  >
    <img src="/assets/megumin/magic-circle.png" alt="" class="seal-img" />
    <span class="ring ring-outer"></span>
    <span class="ring ring-inner"></span>
  </div>
</template>

<style scoped>
.rune-seal {
  position: relative;
  pointer-events: none;
  animation: sealSpin linear infinite;
  will-change: transform;
}

.rune-seal.reverse {
  animation-direction: reverse;
}

.seal-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 26px rgba(165, 42, 54, 0.5));
  mix-blend-mode: screen;
}

.color .seal-img {
  filter: drop-shadow(0 0 30px rgba(217, 172, 88, 0.65)) saturate(1.1) hue-rotate(-6deg);
}

.ring {
  position: absolute;
  border-radius: 50%;
  border: 1px dashed rgba(217, 172, 88, 0.4);
}

.ring-outer {
  inset: -6%;
  animation: sealSpin 40s linear infinite reverse;
}

.ring-inner {
  inset: 16%;
  border-style: solid;
  border-color: rgba(217, 172, 88, 0.16);
}

@keyframes sealSpin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rune-seal,
  .ring {
    animation: none;
  }
}
</style>
