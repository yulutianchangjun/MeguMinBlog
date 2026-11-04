<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { formatDate } from '@/lib/format'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores/auth'
import { useInteractionStore } from '@/stores/interaction'
import type { BoardMessage, BoardTexture, BoardWall } from '@/types'

const interaction = useInteractionStore()
const auth = useAuthStore()

const walls: { key: BoardWall; label: string; en: string; hint: string }[] = [
  { key: 'top', label: '上墙', en: 'TOP', hint: '横排 · 最显眼的位置' },
  { key: 'left', label: '左墙', en: 'LEFT', hint: '竖排 · 靠门一侧' },
  { key: 'right', label: '右墙', en: 'RIGHT', hint: '竖排 · 靠窗一侧' },
]

const capacity = 5
const batches = ref(1)
const composing = ref(false)
const activeWall = ref<BoardWall>('top')

const form = ref({
  author: localStorage.getItem('mgm:board-name') ?? '',
  content: '',
  wall: 'top' as BoardWall,
  bgColor: '#F4EBDD',
  fontColor: '#3A2027',
  texture: 'paper' as BoardTexture,
})

const bgPalette = ['#F4EBDD', '#F0D9A8', '#E8D5CF', '#DCE8F5', '#D8E5D8', '#A52A36', '#3B2733', '#1F1B26']
const fontPalette = ['#3A2027', '#4A3218', '#22303C', '#2C4234', '#8E2634', '#F4EBDD', '#D9AC58']
const textures: { key: BoardTexture; label: string }[] = [
  { key: 'none', label: '素纸' },
  { key: 'paper', label: '羊皮纸' },
  { key: 'magic', label: '魔法阵' },
  { key: 'grid', label: '方格' },
  { key: 'stars', label: '星屑' },
]

const sortedByWall = computed(() => {
  const map: Record<BoardWall, BoardMessage[]> = { top: [], left: [], right: [] }
  for (const message of interaction.messages) {
    map[message.wall].push(message)
  }
  for (const key of Object.keys(map) as BoardWall[]) {
    map[key].sort((a, b) => a.createdAt - b.createdAt)
  }
  return map
})

const wallBatches = computed(() => {
  const map: Record<BoardWall, BoardMessage[][]> = { top: [], left: [], right: [] }
  for (const wall of walls) {
    const list = sortedByWall.value[wall.key]
    const chunks: BoardMessage[][] = []
    for (let i = 0; i < list.length; i += capacity) chunks.push(list.slice(i, i + capacity))
    map[wall.key] = chunks.length ? chunks : [[]]
  }
  return map
})

const totalBatches = computed(() =>
  Math.max(1, ...walls.map((wall) => wallBatches.value[wall.key].length)),
)

const liveBatch = computed(() => totalBatches.value)

const cardsOf = (wall: BoardWall) => wallBatches.value[wall][batches.value - 1] ?? []

const occupied = (wall: BoardWall) => wallBatches.value[wall][liveBatch.value - 1]?.length ?? 0

const wallAvailable = (wall: BoardWall) => occupied(wall) < capacity

const allWallsFull = computed(() => walls.every((wall) => !wallAvailable(wall.key)))

const autoNewBatch = computed(() => allWallsFull.value)

const currentCards = computed(() =>
  walls.reduce((sum, wall) => sum + cardsOf(wall.key).length, 0),
)

const totalCards = computed(() => interaction.messages.length)

const sealedBatches = computed(() => Math.max(0, totalBatches.value - 1))

const previewStyle = computed(() => ({
  background: form.value.bgColor,
  color: form.value.fontColor,
}))

const currentWallHint = computed(() => walls.find((w) => w.key === form.value.wall)?.hint ?? '')

function setWall(wall: BoardWall) {
  if (!wallAvailable(wall)) {
    toast.warning('这面墙的这一批已经钉满了，换一面吧')
    return
  }
  form.value.wall = wall
  activeWall.value = wall
}

function openComposer(wall: BoardWall = 'top') {
  composing.value = true
  const first = walls.find((w) => wallAvailable(w.key))
  form.value.wall = wallAvailable(wall) ? wall : (first?.key ?? 'top')
  activeWall.value = form.value.wall
}

function submit() {
  if (!form.value.content.trim()) {
    toast.warning('卡片上还什么都没写')
    return
  }
  if (!form.value.author.trim()) {
    toast.warning('留个签名吧，方便别人认出你')
    return
  }
  if (form.value.content.length > 160) {
    toast.warning('卡片空间有限，请控制在 160 字以内')
    return
  }
  localStorage.setItem('mgm:board-name', form.value.author.trim())
  const targetWall = wallAvailable(form.value.wall) ? form.value.wall : (walls.find((w) => wallAvailable(w.key))?.key ?? 'top')

  interaction.addMessage({
    author: form.value.author,
    content: form.value.content,
    wall: targetWall,
    bgColor: form.value.bgColor,
    fontColor: form.value.fontColor,
    texture: form.value.texture,
  })

  batches.value = Math.max(totalBatches.value, liveBatch.value)
  form.value.content = ''
  composing.value = false
  toast.success('卡片已经钉上墙了')
}

function togglePin(message: BoardMessage) {
  interaction.toggleMessagePin(message.id)
}

function remove(message: BoardMessage) {
  interaction.deleteMessage(message.id)
  if (batches.value > totalBatches.value) batches.value = totalBatches.value
  toast.info('卡片已取下')
}

function goBatch(next: number) {
  batches.value = Math.min(totalBatches.value, Math.max(1, next))
}

function timeLabel(value: number) {
  return formatDate(value, 'MM.DD HH:mm')
}

onMounted(() => {
  batches.value = totalBatches.value
})
</script>

<template>
  <div class="board-page">
    <header class="head mage-card tint-primary">
      <div class="head-inner">
        <span class="eyebrow"><i class="tag-dot"></i>Message Board · 软木留言墙</span>
        <h1>钉一张卡，<span class="gold-text">留在这间屋子</span></h1>
        <p>
          三面墙，每面一次只钉 5 张。钉满之后这一批会封存进档案，新的卡片重新开始——
          后浪覆前浪，但旧的字不会消失。
        </p>
      </div>
      <div class="head-stats">
        <div><strong>{{ totalCards }}</strong><span>张卡片</span></div>
        <div><strong>{{ sealedBatches }}</strong><span>批封存</span></div>
        <div><strong>{{ currentCards }}</strong><span>本屏可见</span></div>
      </div>
    </header>

    <div class="batch-bar mage-card">
      <div class="batch-info">
        <MagicIcon name="layers" :size="15" />
        <span>批次</span>
        <strong>第 {{ batches }} 批</strong>
        <em>/ 共 {{ totalBatches }} 批</em>
        <span v-if="batches < totalBatches" class="sealed">历史批次</span>
        <span v-else class="live">正在书写</span>
      </div>
      <div class="batch-actions">
        <button class="mini-btn" :disabled="batches >= totalBatches" @click="goBatch(batches + 1)">
          <MagicIcon name="chevronLeft" :size="13" />
          更新的一批
        </button>
        <button class="mini-btn" :disabled="batches <= 1" @click="goBatch(batches - 1)">
          更早的一批
          <MagicIcon name="chevronRight" :size="13" />
        </button>
      </div>
    </div>

    <section class="cork mage-card">
      <span class="nail tl"></span>
      <span class="nail tr"></span>
      <span class="nail bl"></span>
      <span class="nail br"></span>

      <div class="board">
        <div class="wall top">
          <span class="wall-tag">TOP · 上墙</span>
          <div class="top-row">
            <article
              v-for="message in cardsOf('top')"
              :key="message.id"
              class="note"
              :class="[`t-${message.texture}`, { pinned: message.pinned }]"
              :style="{ background: message.bgColor, color: message.fontColor, transform: `rotate(${message.rotation}deg)` }"
            >
              <span class="pin"></span>
              <p class="note-text">{{ message.content }}</p>
              <div class="note-meta">
                <strong>{{ message.author }}</strong>
                <span>{{ timeLabel(message.createdAt) }}</span>
              </div>
              <div v-if="auth.isAdmin" class="note-tools">
                <button title="置顶" @click="togglePin(message)"><MagicIcon name="pin" :size="11" /></button>
                <button title="取下" @click="remove(message)"><MagicIcon name="trash" :size="11" /></button>
              </div>
            </article>
            <span v-for="slot in capacity - cardsOf('top').length" :key="`top-slot-${slot}`" class="empty-slot"></span>
          </div>
        </div>

        <div class="wall left">
          <span class="wall-tag vertical">LEFT · 左墙</span>
          <div class="side-col">
            <article
              v-for="message in cardsOf('left')"
              :key="message.id"
              class="note side"
              :class="[`t-${message.texture}`, { pinned: message.pinned }]"
              :style="{ background: message.bgColor, color: message.fontColor, transform: `rotate(${message.rotation}deg)` }"
            >
              <span class="pin left-pin"></span>
              <p class="note-text">{{ message.content }}</p>
              <div class="note-meta">
                <strong>{{ message.author }}</strong>
                <span>{{ timeLabel(message.createdAt) }}</span>
              </div>
              <div v-if="auth.isAdmin" class="note-tools">
                <button title="置顶" @click="togglePin(message)"><MagicIcon name="pin" :size="11" /></button>
                <button title="取下" @click="remove(message)"><MagicIcon name="trash" :size="11" /></button>
              </div>
            </article>
            <span v-for="slot in capacity - cardsOf('left').length" :key="`left-slot-${slot}`" class="empty-slot side"></span>
          </div>
        </div>

        <div class="center">
          <transition name="flip" mode="out-in">
            <div v-if="composing" key="form" class="composer">
              <div class="composer-head">
                <strong>钉一张新卡片</strong>
                <button class="close" @click="composing = false"><MagicIcon name="close" :size="13" /></button>
              </div>

              <div class="preview" :style="previewStyle" :class="`t-${form.texture}`">
                <p>{{ form.content || '卡片预览…' }}</p>
                <div class="preview-meta">
                  <strong>{{ form.author || '匿名旅人' }}</strong>
                  <span>刚刚</span>
                </div>
              </div>

              <label class="field">
                <span>签名</span>
                <input v-model="form.author" maxlength="12" placeholder="你的昵称" />
              </label>

              <label class="field">
                <span>内容</span>
                <textarea
                  v-model="form.content"
                  rows="3"
                  maxlength="160"
                  placeholder="写点什么，别太长，卡片放不下。"
                ></textarea>
              </label>

              <div class="field">
                <span>钉在哪面墙 <em>{{ currentWallHint }}</em></span>
                <div class="wall-picker">
                  <button
                    v-for="wall in walls"
                    :key="wall.key"
                    class="wall-option"
                    :class="{ active: form.wall === wall.key, full: !wallAvailable(wall.key) }"
                    :disabled="!wallAvailable(wall.key)"
                    @click="setWall(wall.key)"
                  >
                    {{ wall.label }}
                    <em>{{ occupied(wall.key) }}/{{ capacity }}</em>
                  </button>
                </div>
                <span v-if="autoNewBatch" class="warn">三面墙都已钉满，提交后会自动开启新批次。</span>
              </div>

              <div class="field">
                <span>底色 / 字色</span>
                <div class="swatches">
                  <button
                    v-for="color in bgPalette"
                    :key="`bg-${color}`"
                    class="swatch"
                    :class="{ on: form.bgColor === color }"
                    :style="{ background: color }"
                    @click="form.bgColor = color"
                  ></button>
                  <input v-model="form.bgColor" type="color" class="color-input" title="自定义底色" />
                </div>
                <div class="swatches">
                  <button
                    v-for="color in fontPalette"
                    :key="`fg-${color}`"
                    class="swatch"
                    :class="{ on: form.fontColor === color }"
                    :style="{ background: color }"
                    @click="form.fontColor = color"
                  ></button>
                  <input v-model="form.fontColor" type="color" class="color-input" title="自定义字色" />
                </div>
              </div>

              <div class="field">
                <span>纸纹</span>
                <div class="textures">
                  <button
                    v-for="texture in textures"
                    :key="texture.key"
                    class="texture-btn"
                    :class="{ active: form.texture === texture.key }"
                    @click="form.texture = texture.key"
                  >
                    {{ texture.label }}
                  </button>
                </div>
              </div>

              <button class="btn-magic full" @click="submit">
                <MagicIcon name="pin" :size="14" />
                钉上去
              </button>
            </div>

            <div v-else key="info" class="board-info">
              <span class="info-seal"></span>
              <span class="info-rune">MAGIC BOARD</span>
              <h2>三面钉板</h2>
              <p>
                每面墙一批 5 张。选一面还没钉满的墙，挑一种纸色，写下你的名字。
              </p>

              <div class="slots">
                <div v-for="wall in walls" :key="wall.key" class="slot-stat">
                  <div class="slot-head">
                    <span>{{ wall.label }}</span>
                    <em>{{ occupied(wall.key) }}/{{ capacity }}</em>
                  </div>
                  <div class="dots">
                    <i
                      v-for="n in capacity"
                      :key="n"
                      :class="{ on: n <= occupied(wall.key) }"
                    ></i>
                  </div>
                </div>
              </div>

              <button class="btn-magic full" @click="openComposer(activeWall)">
                <MagicIcon name="plus" :size="14" />
                钉一张卡
              </button>
              <p class="hint">
                <MagicIcon name="lock" :size="10" />
                置顶与取下仅博主可用
              </p>
            </div>
          </transition>
        </div>

        <div class="wall right">
          <span class="wall-tag vertical right">RIGHT · 右墙</span>
          <div class="side-col">
            <article
              v-for="message in cardsOf('right')"
              :key="message.id"
              class="note side"
              :class="[`t-${message.texture}`, { pinned: message.pinned }]"
              :style="{ background: message.bgColor, color: message.fontColor, transform: `rotate(${message.rotation}deg)` }"
            >
              <span class="pin right-pin"></span>
              <p class="note-text">{{ message.content }}</p>
              <div class="note-meta">
                <strong>{{ message.author }}</strong>
                <span>{{ timeLabel(message.createdAt) }}</span>
              </div>
              <div v-if="auth.isAdmin" class="note-tools">
                <button title="置顶" @click="togglePin(message)"><MagicIcon name="pin" :size="11" /></button>
                <button title="取下" @click="remove(message)"><MagicIcon name="trash" :size="11" /></button>
              </div>
            </article>
            <span v-for="slot in capacity - cardsOf('right').length" :key="`right-slot-${slot}`" class="empty-slot side"></span>
          </div>
        </div>
      </div>
    </section>

    <section class="archive mage-card">
      <div class="archive-head">
        <MagicIcon name="layers" :size="14" />
        <strong>批次档案</strong>
        <span>钉满 5 张即封存，可回看旧批次</span>
      </div>
      <div class="archive-list">
        <button
          v-for="n in totalBatches"
          :key="n"
          class="archive-btn"
          :class="{ active: batches === n }"
          @click="goBatch(n)"
        >
          <span>第 {{ n }} 批</span>
          <em>{{ n === totalBatches ? '书写中' : '已封存' }}</em>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.board-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.head {
  padding: 30px 32px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  position: relative;
  overflow: hidden;
}

.head::after {
  content: '';
  position: absolute;
  right: -40px;
  top: -60px;
  width: 260px;
  height: 260px;
  background: url('/assets/megumin/pentagram.png') center/contain no-repeat;
  opacity: 0.12;
  transform: rotate(10deg);
}

.head-inner {
  position: relative;
  z-index: 1;
}

.head h1 {
  margin: 10px 0 10px;
  font-size: clamp(25px, 2.9vw, 33px);
  letter-spacing: 0.04em;
}

.head p {
  margin: 0;
  max-width: 520px;
  font-size: 12.5px;
  line-height: 1.9;
  color: var(--c-text-2);
}

.head-stats {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 18px;
}

.head-stats div {
  text-align: center;
}

.head-stats strong {
  display: block;
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--c-gold-2);
  line-height: 1.1;
}

.head-stats span {
  font-size: 9.5px;
  letter-spacing: 0.08em;
  color: var(--c-muted);
}

.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  flex-wrap: wrap;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--c-muted);
}

.batch-info strong {
  font-family: var(--font-display);
  font-size: 13px;
  color: var(--c-gold-2);
  letter-spacing: 0.06em;
}

.batch-info em {
  font-style: normal;
  font-family: var(--font-mono);
  font-size: 10px;
}

.sealed,
.live {
  font-size: 9.5px;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px dashed rgba(217, 172, 88, 0.3);
  color: var(--c-gold);
}

.live {
  border-style: solid;
  border-color: rgba(199, 60, 75, 0.5);
  background: rgba(165, 42, 54, 0.2);
  color: #ffc9cf;
}

.batch-actions {
  display: flex;
  gap: 6px;
}

.mini-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.18);
  background: rgba(20, 16, 26, 0.6);
  color: var(--c-text-2);
  font-size: 10.5px;
  cursor: pointer;
  transition: all 0.22s var(--ease);
}

.mini-btn:hover:not(:disabled) {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.45);
}

.mini-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

/* ---------- 软木板 ---------- */

.cork {
  position: relative;
  padding: 26px 22px 22px;
  border-radius: 16px;
  border: 10px solid #2a1a18;
  box-shadow:
    inset 0 0 0 1px rgba(217, 172, 88, 0.35),
    inset 0 0 90px rgba(0, 0, 0, 0.7),
    0 24px 50px -30px #000;
  background:
    radial-gradient(80% 60% at 50% 0%, rgba(165, 42, 54, 0.22), transparent 62%),
    repeating-linear-gradient(48deg, rgba(0, 0, 0, 0.16) 0 1px, transparent 1px 3px),
    repeating-linear-gradient(-42deg, rgba(120, 62, 48, 0.18) 0 1px, transparent 1px 4px),
    linear-gradient(155deg, #3a2420 0%, #2b1918 52%, #20120f 100%);
}

.nail {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, #f2dba6, #8f743c 70%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

.nail.tl {
  top: 8px;
  left: 8px;
}
.nail.tr {
  top: 8px;
  right: 8px;
}
.nail.bl {
  bottom: 8px;
  left: 8px;
}
.nail.br {
  bottom: 8px;
  right: 8px;
}

.board {
  display: grid;
  grid-template-columns: 176px minmax(0, 1fr) 176px;
  grid-template-areas:
    'top top top'
    'left center right';
  gap: 14px;
}

.wall {
  position: relative;
}

.wall.top {
  grid-area: top;
}

.wall.left {
  grid-area: left;
}

.wall.right {
  grid-area: right;
}

.center {
  grid-area: center;
  min-width: 0;
}

.wall-tag {
  display: inline-block;
  margin-bottom: 8px;
  font-family: var(--font-display);
  font-size: 8px;
  letter-spacing: 0.26em;
  color: rgba(242, 219, 166, 0.45);
}

.wall-tag.vertical {
  position: absolute;
  left: -14px;
  top: 50%;
  transform: translateY(-50%) rotate(180deg);
  writing-mode: vertical-rl;
  margin: 0;
}

.wall-tag.right {
  left: auto;
  right: -14px;
  transform: translateY(-50%);
}

.top-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.side-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wall.left .side-col {
  padding-right: 8px;
}

.wall.right .side-col {
  padding-left: 8px;
}

/* ---------- 卡片 ---------- */

.note {
  position: relative;
  padding: 14px 12px 10px;
  border-radius: 3px;
  min-height: 118px;
  display: flex;
  flex-direction: column;
  color: #3a2027;
  box-shadow:
    0 10px 18px -10px rgba(0, 0, 0, 0.85),
    0 1px 0 rgba(255, 255, 255, 0.4) inset;
  transition: transform 0.3s var(--ease), box-shadow 0.3s var(--ease), z-index 0s;
  transform-origin: center top;
}

.note.side {
  min-height: 96px;
  padding: 13px 11px 9px;
}

.note:hover {
  transform: rotate(0deg) scale(1.035) !important;
  box-shadow: 0 18px 30px -12px rgba(0, 0, 0, 0.9);
  z-index: 5;
}

.note.pinned {
  box-shadow:
    0 0 0 2px rgba(217, 172, 88, 0.85),
    0 12px 22px -10px rgba(0, 0, 0, 0.85);
}

.note-text {
  margin: 0 0 8px;
  font-size: 11.5px;
  line-height: 1.7;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: pre-wrap;
}

.side .note-text {
  font-size: 11px;
  -webkit-line-clamp: 4;
}

.note-meta {
  margin-top: auto;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 6px;
  font-size: 8.5px;
  opacity: 0.72;
  text-align: right;
  line-height: 1.3;
}

.note-meta strong {
  font-weight: 600;
  max-width: 66px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-meta span {
  font-family: var(--font-mono);
  font-size: 8px;
  opacity: 0.8;
}

.pin {
  position: absolute;
  left: 50%;
  top: -5px;
  width: 9px;
  height: 9px;
  margin-left: -4.5px;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 28%, #ffb1a0, #a52a36 65%, #5c121c);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.55), 0 0 8px rgba(199, 60, 75, 0.4);
}

.pin.left-pin {
  left: -3px;
  top: 50%;
  margin: -4.5px 0 0;
}

.pin.right-pin {
  left: auto;
  right: -3px;
  top: 50%;
  margin: -4.5px 0 0;
}

.note-tools {
  position: absolute;
  right: 3px;
  top: 3px;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s var(--ease);
}

.note:hover .note-tools {
  opacity: 1;
}

.note-tools button {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 0;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  cursor: pointer;
}

.note-tools button:hover {
  background: rgba(165, 42, 54, 0.9);
}

/* 纸纹 */
.t-paper {
  background-image:
    linear-gradient(180deg, rgba(255, 255, 255, 0.35), transparent 40%),
    repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.025) 0 1px, transparent 1px 3px);
}

.t-magic::after {
  content: '';
  position: absolute;
  inset: 0;
  background: url('/assets/megumin/magic-circle-small.png') center/78% no-repeat;
  opacity: 0.14;
  mix-blend-mode: multiply;
  pointer-events: none;
  border-radius: inherit;
}

.t-grid {
  background-image:
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.07) 0 1px, transparent 1px 16px),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.07) 0 1px, transparent 1px 16px);
}

.t-stars {
  background-image:
    radial-gradient(circle at 18% 24%, rgba(255, 255, 255, 0.45) 0 1px, transparent 1px),
    radial-gradient(circle at 72% 36%, rgba(255, 255, 255, 0.35) 0 1px, transparent 1px),
    radial-gradient(circle at 42% 78%, rgba(255, 255, 255, 0.4) 0 1px, transparent 1px),
    radial-gradient(circle at 88% 82%, rgba(255, 255, 255, 0.3) 0 1px, transparent 1px);
}

.empty-slot {
  border-radius: 3px;
  border: 1px dashed rgba(242, 219, 166, 0.18);
  min-height: 118px;
  background: rgba(255, 255, 255, 0.015);
}

.empty-slot.side {
  min-height: 96px;
}

/* ---------- 中央面板 ---------- */

.board-info,
.composer {
  height: 100%;
  min-height: 100%;
  padding: 18px;
  border-radius: 10px;
  border: 1px dashed rgba(242, 219, 166, 0.25);
  background: rgba(18, 12, 16, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.board-info {
  position: relative;
  overflow: hidden;
}

.board-info > *:not(.info-seal) {
  position: relative;
  z-index: 1;
}

.info-seal {
  position: absolute;
  left: 50%;
  bottom: -70px;
  width: 230px;
  height: 230px;
  margin-left: -115px;
  background: url('/assets/megumin/magic-circle.png') center/contain no-repeat;
  opacity: 0.16;
  animation: spin 90s linear infinite;
  pointer-events: none;
  mix-blend-mode: screen;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.info-rune {
  font-family: var(--font-display);
  font-size: 8px;
  letter-spacing: 0.4em;
  color: rgba(242, 219, 166, 0.4);
}

.board-info h2 {
  margin: 0;
  font-size: 24px;
  letter-spacing: 0.08em;
}

.board-info p {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.8;
  color: var(--c-text-2);
}

.slots {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(217, 172, 88, 0.12);
}

.slot-head {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  color: var(--c-text-2);
  margin-bottom: 5px;
}

.slot-head em {
  font-style: normal;
  font-family: var(--font-mono);
  color: var(--c-gold);
}

.dots {
  display: flex;
  gap: 4px;
}

.dots i {
  flex: 1;
  height: 3px;
  border-radius: 99px;
  background: rgba(242, 219, 166, 0.15);
}

.dots i.on {
  background: linear-gradient(90deg, #a52a36, #d9ac58);
}

.btn-magic.full {
  width: 100%;
  padding: 9px;
  font-size: 12px;
  margin-top: auto;
}

.hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 0;
  font-size: 9.5px;
  color: var(--c-muted);
}

.composer {
  gap: 10px;
  border-style: solid;
  overflow-y: auto;
  max-height: 640px;
}

.composer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.composer-head strong {
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.06em;
  color: var(--c-paper);
}

.close {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.2);
  background: transparent;
  color: var(--c-text-2);
  cursor: pointer;
}

.preview {
  position: relative;
  padding: 14px 13px 10px;
  border-radius: 3px;
  min-height: 92px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 18px -12px rgba(0, 0, 0, 0.9);
  transform: rotate(-1deg);
}

.preview p {
  margin: 0 0 8px;
  font-size: 11.5px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-meta {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  font-size: 8.5px;
  opacity: 0.7;
}

.preview-meta strong {
  font-weight: 600;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field > span {
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--c-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.field > span em {
  font-style: normal;
  color: rgba(217, 172, 88, 0.6);
  font-size: 9.5px;
}

.field input:not([type='color']),
.field textarea {
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid rgba(217, 172, 88, 0.18);
  background: rgba(13, 10, 17, 0.7);
  color: var(--c-text);
  font-family: inherit;
  font-size: 11.5px;
  outline: none;
  resize: vertical;
  transition: border-color 0.22s var(--ease);
}

.field input:focus,
.field textarea:focus {
  border-color: rgba(217, 172, 88, 0.5);
}

.wall-picker {
  display: flex;
  gap: 5px;
}

.wall-option {
  flex: 1;
  padding: 5px 4px;
  border-radius: 7px;
  border: 1px solid rgba(217, 172, 88, 0.16);
  background: rgba(20, 15, 26, 0.6);
  color: var(--c-text-2);
  font-size: 10.5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  transition: all 0.2s var(--ease);
}

.wall-option em {
  font-style: normal;
  font-family: var(--font-mono);
  font-size: 8.5px;
  opacity: 0.65;
}

.wall-option.active {
  color: #fff3e0;
  border-color: rgba(242, 219, 166, 0.5);
  background: linear-gradient(150deg, rgba(165, 42, 54, 0.75), rgba(100, 28, 43, 0.5));
}

.wall-option.full {
  opacity: 0.32;
  cursor: not-allowed;
  text-decoration: line-through;
}

.warn {
  font-size: 9.5px;
  color: #e0a86a;
  line-height: 1.5;
}

.swatches {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.35);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
  cursor: pointer;
  padding: 0;
  transition: transform 0.18s var(--ease);
}

.swatch:hover {
  transform: scale(1.12);
}

.swatch.on {
  box-shadow: 0 0 0 2px rgba(217, 172, 88, 0.85);
}

.color-input {
  width: 22px;
  height: 20px;
  padding: 0;
  border: 1px solid rgba(217, 172, 88, 0.25);
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
}

.textures {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.texture-btn {
  padding: 4px 9px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.16);
  background: transparent;
  color: var(--c-text-2);
  font-size: 10px;
  cursor: pointer;
}

.texture-btn.active {
  color: #fff3e0;
  border-color: rgba(242, 219, 166, 0.5);
  background: rgba(165, 42, 54, 0.4);
}

/* ---------- 档案 ---------- */

.archive {
  padding: 14px 16px;
}

.archive-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--c-muted);
  margin-bottom: 10px;
}

.archive-head strong {
  font-family: var(--font-display);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--c-paper);
}

.archive-head span {
  margin-left: auto;
  font-size: 10px;
}

.archive-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.archive-btn {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid rgba(217, 172, 88, 0.16);
  background: rgba(20, 16, 26, 0.6);
  color: var(--c-text-2);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.22s var(--ease);
}

.archive-btn em {
  font-style: normal;
  font-size: 8.5px;
  color: var(--c-muted);
}

.archive-btn.active {
  border-color: rgba(242, 219, 166, 0.45);
  background: rgba(165, 42, 54, 0.3);
  color: #fff3e0;
}

.archive-btn.active em {
  color: var(--c-gold);
}

.flip-enter-active,
.flip-leave-active {
  transition: opacity 0.24s var(--ease), transform 0.24s var(--ease);
}

.flip-enter-from {
  opacity: 0;
  transform: rotateY(-14deg) translateY(6px);
}

.flip-leave-to {
  opacity: 0;
  transform: rotateY(14deg) translateY(-6px);
}

@media (max-width: 1080px) {
  .board {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      'top top'
      'center center'
      'left right';
  }
  .top-row {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .board-info,
  .composer {
    min-height: 0;
  }
  .wall-tag.vertical {
    position: static;
    transform: none;
    writing-mode: horizontal-tb;
    margin-bottom: 6px;
  }
}

@media (max-width: 760px) {
  .head {
    flex-direction: column;
    align-items: flex-start;
    padding: 24px 20px;
  }
  .cork {
    padding: 18px 14px;
    border-width: 7px;
  }
  .board {
    grid-template-columns: 1fr;
    grid-template-areas:
      'top'
      'center'
      'left'
      'right';
  }
  .top-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .empty-slot {
    display: none;
  }
  .note {
    min-height: 92px;
  }
  .empty-slot.side {
    display: none;
  }
}
</style>
