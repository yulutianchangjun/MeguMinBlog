<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Ember {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  maxLife: number
  baseAlpha: number
  sprite: number
  phase: number
}

interface Glint {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  maxLife: number
  baseAlpha: number
  rotation: number
  spin: number
  image: number
}

const props = withDefaults(
  defineProps<{
    count?: number
    inline?: boolean
    glow?: boolean
  }>(),
  { count: 78, inline: false, glow: true },
)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const base = import.meta.env.BASE_URL

let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let width = 0
let height = 0
let dpr = 1
let lastTime = 0
let paused = false
let observer: ResizeObserver | null = null

const embers: Ember[] = []
const glints: Glint[] = []
const sprites: HTMLCanvasElement[] = []
const starImages: HTMLImageElement[] = []

const EMBER_COUNT = props.count
const GLINT_COUNT = Math.max(3, Math.round(props.count * 0.12))

function makeSprite(inner: string, outer: string): HTMLCanvasElement {
  const size = 64
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const g = c.getContext('2d')
  if (g) {
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, inner)
    grad.addColorStop(0.35, outer)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, size, size)
  }
  return c
}

function spawnEmber(ember: Ember, initial = false) {
  const fromTop = Math.random() < 0.6
  if (fromTop) {
    ember.x = Math.random() * width * 1.25 - width * 0.08
    ember.y = initial ? Math.random() * height : -24 - Math.random() * 90
  } else {
    ember.x = width + 20 + Math.random() * 120
    ember.y = Math.random() * height * 0.9 - height * 0.12
  }
  const speed = 0.45 + Math.random() * 1.35
  // 225°：向左下，初速略偏水平，随后由重力拉出下坠弧线
  ember.vx = -speed * 0.86
  ember.vy = speed * 0.42
  ember.size = 0.9 + Math.random() * 3.1
  ember.life = initial ? Math.random() * 120 : 0
  ember.maxLife = 260 + Math.random() * 300
  ember.baseAlpha = 0.3 + Math.random() * 0.6
  ember.sprite = Math.floor(Math.random() * 3)
  ember.phase = Math.random() * Math.PI * 2
}

function spawnGlint(glint: Glint, initial = false) {
  glint.x = Math.random() * width
  glint.y = initial ? Math.random() * height : -30 - Math.random() * 60
  glint.vx = -(0.25 + Math.random() * 0.5)
  glint.vy = 0.32 + Math.random() * 0.55
  glint.size = 10 + Math.random() * 18
  glint.life = initial ? Math.random() * 200 : 0
  glint.maxLife = 420 + Math.random() * 360
  glint.baseAlpha = 0.2 + Math.random() * 0.4
  glint.rotation = Math.random() * Math.PI * 2
  glint.spin = (Math.random() - 0.5) * 0.012
  glint.image = Math.floor(Math.random() * starImages.length)
}

function resize() {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  width = rect.width || window.innerWidth
  height = rect.height || window.innerHeight
  dpr = Math.min(2, window.devicePixelRatio || 1)
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  ctx = canvas.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  for (const ember of embers) {
    if (ember.x > width + 60 || ember.y > height + 60) spawnEmber(ember, true)
  }
}

function draw(time: number) {
  if (!ctx) return
  const dt = Math.min(2.6, Math.max(0.2, (time - lastTime) / 16.667 || 1))
  lastTime = time
  ctx.clearRect(0, 0, width, height)
  ctx.globalCompositeOperation = 'lighter'

  for (const ember of embers) {
    ember.life += dt
    ember.vy += 0.014 * dt
    ember.vx += 0.0012 * dt
    ember.x += ember.vx * dt
    ember.y += ember.vy * dt

    if (ember.y - 40 > height || ember.x + 40 < 0 || ember.life > ember.maxLife) {
      spawnEmber(ember)
      continue
    }

    const progress = ember.life / ember.maxLife
    const fade = Math.sin(Math.min(1, progress) * Math.PI)
    const flicker = 0.78 + 0.22 * Math.sin(time * 0.004 + ember.phase)
    const alpha = ember.baseAlpha * fade * flicker
    if (alpha <= 0.01) continue
    const radius = ember.size * (0.7 + progress * 0.6) * 5
    ctx.globalAlpha = alpha
    ctx.drawImage(sprites[ember.sprite], ember.x - radius, ember.y - radius, radius * 2, radius * 2)
  }

  for (const glint of glints) {
    glint.life += dt
    glint.x += glint.vx * dt
    glint.y += glint.vy * dt
    glint.rotation += glint.spin * dt
    if (glint.y - 40 > height || glint.x + 40 < 0 || glint.life > glint.maxLife) {
      spawnGlint(glint)
      continue
    }
    const progress = glint.life / glint.maxLife
    const fade = Math.sin(Math.min(1, progress) * Math.PI)
    const twinkle = 0.55 + 0.45 * Math.sin(time * 0.003 + glint.rotation * 2)
    const img = starImages[glint.image]
    if (!img?.complete) continue
    ctx.globalAlpha = glint.baseAlpha * fade * twinkle
    ctx.save()
    ctx.translate(glint.x, glint.y)
    ctx.rotate(glint.rotation)
    ctx.drawImage(img, -glint.size / 2, -glint.size / 2, glint.size, glint.size)
    ctx.restore()
  }

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  if (!paused) raf = requestAnimationFrame(draw)
}

function onVisibility() {
  if (document.hidden) {
    paused = true
    cancelAnimationFrame(raf)
  } else if (!paused) {
    return
  } else {
    paused = false
    lastTime = performance.now()
    raf = requestAnimationFrame(draw)
  }
}

onMounted(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return

  sprites.push(
    makeSprite('rgba(255,246,214,0.95)', 'rgba(255,176,84,0.55)'),
    makeSprite('rgba(255,214,150,0.9)', 'rgba(226,104,52,0.5)'),
    makeSprite('rgba(255,180,120,0.85)', 'rgba(150,32,44,0.45)'),
  )

  const urls = [
    `${base}assets/textures/star-1.webp`,
    `${base}assets/textures/star-2.webp`,
    `${base}assets/textures/star-3.webp`,
  ]
  for (const url of urls) {
    const img = new Image()
    img.src = url
    starImages.push(img)
  }

  resize()
  for (let i = 0; i < EMBER_COUNT; i += 1) {
    const ember = {} as Ember
    spawnEmber(ember, true)
    embers.push(ember)
  }
  for (let i = 0; i < GLINT_COUNT; i += 1) {
    const glint = {} as Glint
    spawnGlint(glint, true)
    glints.push(glint)
  }

  lastTime = performance.now()
  raf = requestAnimationFrame(draw)
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', onVisibility)
  observer = new ResizeObserver(() => resize())
  if (canvasRef.value) observer.observe(canvasRef.value)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
  window.removeEventListener('resize', resize)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <div class="fire-rain" :class="{ inline, 'no-glow': !glow }" aria-hidden="true">
    <canvas ref="canvasRef"></canvas>
    <span v-if="glow" class="source-glow"></span>
  </div>
</template>

<style scoped>
.fire-rain {
  position: fixed;
  inset: 0;
  z-index: 999;
  pointer-events: none;
  overflow: hidden;
  mix-blend-mode: screen;
}

.fire-rain.inline {
  position: absolute;
  inset: 0;
  z-index: 999;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.source-glow {
  position: absolute;
  right: -10%;
  top: -22%;
  width: 62vw;
  height: 62vw;
  background: radial-gradient(closest-side, rgba(255, 132, 64, 0.14), rgba(165, 42, 54, 0.06) 45%, transparent 72%);
  filter: blur(6px);
}

@media (prefers-reduced-motion: reduce) {
  .fire-rain {
    display: none;
  }
}
</style>
