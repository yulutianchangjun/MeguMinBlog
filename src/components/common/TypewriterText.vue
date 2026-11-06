<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    lines: string[]
    speed?: number
    pause?: number
    loop?: boolean
    startDelay?: number
    prefix?: string
  }>(),
  { speed: 68, pause: 2100, loop: true, startDelay: 420, prefix: '' },
)

const emit = defineEmits<{ done: [] }>()

const current = ref('')
const lineIndex = ref(0)
const typing = ref(true)
let timer: number | undefined

const display = computed(() => `${props.prefix}${current.value}`)

function schedule(delay: number, fn: () => void) {
  window.clearTimeout(timer)
  timer = window.setTimeout(fn, delay)
}

function typeLine() {
  const line = props.lines[lineIndex.value] ?? ''
  if (current.value.length < line.length) {
    current.value = line.slice(0, current.value.length + 1)
    typing.value = true
    schedule(props.speed, typeLine)
    return
  }
  typing.value = false
  if (!props.loop && lineIndex.value >= props.lines.length - 1) {
    emit('done')
    return
  }
  schedule(props.pause, () => {
    deleteLine()
  })
}

function deleteLine() {
  const line = props.lines[lineIndex.value] ?? ''
  if (current.value.length > 0) {
    current.value = line.slice(0, current.value.length - 1)
    schedule(24, deleteLine)
    return
  }
  lineIndex.value = (lineIndex.value + 1) % props.lines.length
  schedule(260, typeLine)
}

onMounted(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    current.value = props.lines[0] ?? ''
    typing.value = false
    return
  }
  schedule(props.startDelay, typeLine)
})

onBeforeUnmount(() => window.clearTimeout(timer))

watch(
  () => props.lines,
  () => {
    current.value = ''
    lineIndex.value = 0
    schedule(200, typeLine)
  },
)
</script>

<template>
  <span class="typewriter">
    <span class="text">{{ display }}</span>
    <span class="caret" :class="{ blink: !typing }" aria-hidden="true"></span>
  </span>
</template>

<style scoped>
.typewriter {
  display: inline;
}

.caret {
  display: inline-block;
  width: 2px;
  height: 1.05em;
  margin-left: 4px;
  vertical-align: -0.14em;
  background: linear-gradient(180deg, #f2dba6, #a52a36);
  box-shadow: 0 0 10px rgba(217, 172, 88, 0.85);
}

.caret.blink {
  animation: caretBlink 1.05s steps(1, end) infinite;
}

@keyframes caretBlink {
  0%,
  48% {
    opacity: 1;
  }
  49%,
  100% {
    opacity: 0;
  }
}
</style>
