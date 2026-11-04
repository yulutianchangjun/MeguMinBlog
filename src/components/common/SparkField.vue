<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ count?: number; dense?: boolean }>(), {
  count: 26,
  dense: false,
})

interface Spark {
  left: string
  size: number
  delay: string
  duration: string
  drift: string
  opacity: number
  tone: string
}

const sparks = computed<Spark[]>(() => {
  const total = props.dense ? props.count * 2 : props.count
  return Array.from({ length: total }, (_, i) => {
    const seed = (i * 9301 + 49297) % 233280
    const rand = seed / 233280
    const rand2 = ((i * 4177 + 7919) % 10007) / 10007
    return {
      left: `${Math.round(rand * 100)}%`,
      size: 1 + Math.round(rand2 * 3),
      delay: `${(rand2 * 9).toFixed(2)}s`,
      duration: `${(9 + rand * 12).toFixed(2)}s`,
      drift: `${Math.round((rand - 0.5) * 90)}px`,
      opacity: 0.18 + rand2 * 0.55,
      tone: i % 5 === 0 ? 'rgba(217,172,88,1)' : i % 3 === 0 ? 'rgba(199,60,75,1)' : 'rgba(244,235,221,1)',
    }
  })
})
</script>

<template>
  <div class="spark-field" aria-hidden="true">
    <span
      v-for="(spark, index) in sparks"
      :key="index"
      class="spark"
      :style="{
        left: spark.left,
        width: `${spark.size}px`,
        height: `${spark.size}px`,
        animationDelay: spark.delay,
        animationDuration: spark.duration,
        opacity: spark.opacity,
        background: spark.tone,
        boxShadow: `0 0 ${spark.size * 4}px ${spark.tone}`,
        '--drift': spark.drift,
      }"
    ></span>
  </div>
</template>

<style scoped>
.spark-field {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.spark {
  position: absolute;
  bottom: -10px;
  border-radius: 50%;
  animation-name: rise;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes rise {
  0% {
    transform: translate3d(0, 0, 0) scale(0.6);
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  70% {
    opacity: 0.7;
  }
  100% {
    transform: translate3d(var(--drift), -80vh, 0) scale(1.15);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spark {
    animation: none;
    display: none;
  }
}
</style>
