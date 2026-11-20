<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import MagicIcon from '@/components/common/MagicIcon.vue'

/**
 * SVG（Mermaid 图表）放大预览。
 * 桌面：滚轮缩放、鼠标拖拽平移、双击复位。
 * 手机：双指捏合缩放（同时跟随两指中点平移）、单指拖动，按钮缩放兜底。
 */

const props = defineProps<{ svg: string; label?: string }>()
const emit = defineEmits<{ close: [] }>()

const MIN_SCALE = 0.4
const MAX_SCALE = 4

const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const dragging = ref(false)

/** 触屏设备给不同提示（hover 提示在移动端没有意义） */
const isTouch = ref(
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
)
const hintText = computed(() => (isTouch.value ? '双指缩放 · 单指拖动' : '滚轮缩放 · 拖拽平移'))

/** 当前按下的指针（鼠标只有一个，触屏可能两个以上） */
const pointers = new Map<number, { x: number; y: number }>()

let dragStartX = 0
let dragStartY = 0
let dragOriginX = 0
let dragOriginY = 0

let pinchStartDistance = 0
let pinchStartScale = 1
let pinchStartMidX = 0
let pinchStartMidY = 0
let pinchOriginX = 0
let pinchOriginY = 0

function clamp(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
}

function pointerList() {
  return Array.from(pointers.values())
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function zoom(delta: number) {
  scale.value = clamp(scale.value + delta)
}

function reset() {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
}

function onWheel(event: WheelEvent) {
  event.preventDefault()
  zoom(event.deltaY < 0 ? 0.15 : -0.15)
}

/** 记录双指起始状态：距离决定缩放比，中点决定平移量 */
function beginPinch() {
  const [a, b] = pointerList()
  pinching = true
  dragging.value = false
  pinchStartDistance = distance(a, b)
  pinchStartScale = scale.value
  const mid = midpoint(a, b)
  pinchStartMidX = mid.x
  pinchStartMidY = mid.y
  pinchOriginX = offsetX.value
  pinchOriginY = offsetY.value
}

let pinching = false

function onPointerDown(event: PointerEvent) {
  // 只响应鼠标主键；触屏 pointerType 是 touch，button 为 0
  if (event.pointerType === 'mouse' && event.button !== 0) return
  const el = event.currentTarget as HTMLElement
  el.setPointerCapture?.(event.pointerId)
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (pointers.size === 1) {
    dragging.value = true
    dragStartX = event.clientX
    dragStartY = event.clientY
    dragOriginX = offsetX.value
    dragOriginY = offsetY.value
  } else if (pointers.size === 2) {
    beginPinch()
  }
}

function onPointerMove(event: PointerEvent) {
  if (!pointers.has(event.pointerId)) return
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  // 双指：缩放 + 跟随中点平移
  if (pointers.size >= 2 && pinching) {
    const [a, b] = pointerList()
    const dist = distance(a, b)
    if (pinchStartDistance > 8) {
      scale.value = clamp(pinchStartScale * (dist / pinchStartDistance))
    }
    const mid = midpoint(a, b)
    offsetX.value = pinchOriginX + (mid.x - pinchStartMidX)
    offsetY.value = pinchOriginY + (mid.y - pinchStartMidY)
    return
  }

  if (!dragging.value) return
  offsetX.value = dragOriginX + (event.clientX - dragStartX)
  offsetY.value = dragOriginY + (event.clientY - dragStartY)
}

function onPointerUp(event: PointerEvent) {
  pointers.delete(event.pointerId)
  const el = event.currentTarget as HTMLElement
  el.releasePointerCapture?.(event.pointerId)

  if (pointers.size === 1) {
    // 双指松掉一根：以剩下这根为新起点继续拖动，避免画面跳变
    const [rest] = pointerList()
    pinching = false
    pinchStartDistance = 0
    dragging.value = true
    dragStartX = rest.x
    dragStartY = rest.y
    dragOriginX = offsetX.value
    dragOriginY = offsetY.value
  } else if (pointers.size === 0) {
    pinching = false
    pinchStartDistance = 0
    dragging.value = false
  } else if (pointers.size >= 2) {
    // 三指以上：重新以当前两指为基准
    beginPinch()
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

/** iOS Safari 不认 touch-action: none 对页面级双指缩放的限制，弹窗期间临时收紧 viewport */
let savedViewport: string | null = null

function lockPageZoom() {
  const meta = document.querySelector('meta[name="viewport"]')
  if (!meta) return
  savedViewport = meta.getAttribute('content')
  meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
}

function unlockPageZoom() {
  const meta = document.querySelector('meta[name="viewport"]')
  if (meta && savedViewport !== null) meta.setAttribute('content', savedViewport)
  savedViewport = null
}

watch(
  () => props.svg,
  (value) => {
    if (value) {
      reset()
      pointers.clear()
      pinching = false
      document.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
      lockPageZoom()
    } else {
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
      unlockPageZoom()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  unlockPageZoom()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div
        v-if="svg"
        class="svg-lightbox"
        role="dialog"
        aria-modal="true"
        @click.self="emit('close')"
        @wheel.prevent="onWheel"
      >
        <div class="toolbar" @click.stop>
          <span class="ratio">{{ Math.round(scale * 100) }}%</span>
          <span class="hint">{{ hintText }}</span>
          <div class="actions">
            <button type="button" title="缩小" aria-label="缩小" @click="zoom(-0.25)">
              <MagicIcon name="minus" :size="13" />
            </button>
            <button type="button" class="reset" @click="reset">重置</button>
            <button type="button" title="放大" aria-label="放大" @click="zoom(0.25)">
              <MagicIcon name="plus" :size="13" />
            </button>
            <button type="button" class="close" aria-label="关闭" @click="emit('close')">
              <MagicIcon name="close" :size="14" />
            </button>
          </div>
        </div>

        <div
          class="canvas"
          :class="{ dragging }"
          :style="{
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          }"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @dblclick="reset"
          v-html="svg"
        ></div>

        <p v-if="label" class="label">{{ label }}</p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.svg-lightbox {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5vh 4vw;
  background: rgba(8, 6, 11, 0.92);
  backdrop-filter: blur(6px);
  overflow: hidden;
  touch-action: none;
}

.toolbar {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 9px 7px 14px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.32);
  background: rgba(23, 21, 28, 0.94);
  box-shadow: 0 16px 40px -22px #000;
  max-width: calc(100vw - 24px);
}

.ratio {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--c-gold);
  min-width: 34px;
}

.hint {
  font-size: 10.5px;
  color: var(--c-muted);
  white-space: nowrap;
}

.actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  min-width: 26px;
  height: 26px;
  padding: 0 7px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.22);
  background: rgba(16, 12, 20, 0.7);
  color: var(--c-text-2);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.actions button:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.6);
  background: rgba(217, 172, 88, 0.1);
}

.actions button.reset {
  padding: 0 10px;
  min-width: 44px;
  white-space: nowrap;
}

.actions button.close {
  border-color: rgba(165, 42, 54, 0.6);
  background: rgba(165, 42, 54, 0.22);
  color: #f0d7dc;
}

.actions button.close:hover {
  background: rgba(165, 42, 54, 0.4);
  border-color: rgba(165, 42, 54, 0.9);
  color: #fff;
}

.canvas {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  max-height: 100%;
  cursor: grab;
  user-select: none;
  will-change: transform;
  /* 双指手势交给组件自己处理，避免浏览器滚动/缩放抢走 */
  touch-action: none;
}

.canvas.dragging {
  cursor: grabbing;
}

/* 克隆进来的 svg：内联 width/height 按 viewBox 原始尺寸给，
   超大时靠 max-* 收敛到视口内；放大交给 transform，不受这两个限制 */
.canvas :deep(svg) {
  display: block;
  max-width: 90vw;
  max-height: 78vh;
}

.label {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(23, 21, 28, 0.85);
  border: 1px solid rgba(217, 172, 88, 0.18);
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--c-muted);
}

.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.22s var(--ease);
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

@media (max-width: 560px) {
  .hint {
    display: none;
  }
  .toolbar {
    gap: 8px;
    padding: 6px 7px 6px 11px;
  }
}
</style>
