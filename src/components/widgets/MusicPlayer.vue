<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MagicIcon from '@/components/common/MagicIcon.vue'
import AddMusicModal from '@/components/widgets/AddMusicModal.vue'
import PlaylistModal from '@/components/widgets/PlaylistModal.vue'
import { useAuthStore } from '@/stores/auth'
import { usePlayerStore } from '@/stores/player'

const player = usePlayerStore()
const auth = useAuthStore()

const listOpen = ref(false)
const addOpen = ref(false)

const track = computed(() => player.current)
const cover = computed(() => player.coverUrl(track.value))
const isSynth = computed(() => track.value?.kind === 'synth')
const canSeek = computed(() => !isSynth.value)
const percent = computed(() => Math.round(player.progress * 100))

const timeLabel = (value: number): string => {
  if (!Number.isFinite(value) || value < 0) return '00:00'
  const total = Math.floor(value)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

const elapsed = computed(() => timeLabel(player.currentTime))
const total = computed(() => (player.duration ? timeLabel(player.duration) : '--:--'))
const synthLabel = computed(() => (player.currentTune ? `${player.currentTune.bpm} BPM · 循环` : '循环'))

function toggle() {
  void player.toggle()
}

function prev() {
  void player.prev()
}

function next() {
  void player.next()
}

function onSeek(event: MouseEvent) {
  if (!canSeek.value) return
  const element = event.currentTarget as HTMLElement
  const rect = element.getBoundingClientRect()
  if (!rect.width) return
  player.seek((event.clientX - rect.left) / rect.width)
}

function onVolume(event: Event) {
  player.setVolume(Number((event.target as HTMLInputElement).value))
}

onMounted(() => {
  void player.load()
})
</script>

<template>
  <section class="music mage-card">
    <div class="panel-title">
      <span>Magic Player</span>
      <div class="head-right">
        <span class="cn">魔法留声机</span>
        <button v-if="auth.isAdmin" class="add-btn" title="添加音乐" @click="addOpen = true">
          <MagicIcon name="plus" :size="12" />
        </button>
      </div>
    </div>

    <div class="disc-row">
      <div class="disc" :class="{ spin: player.playing, 'has-cover': Boolean(cover) }">
        <img v-if="cover" class="disc-cover" :src="cover" alt="" />
        <template v-else>
          <span class="groove"></span>
          <span class="groove inner"></span>
          <span class="label"></span>
        </template>
        <span class="hole"></span>
      </div>

      <div class="meta">
        <div class="title-row">
          <strong>{{ track?.title ?? '未选择曲目' }}</strong>
          <span class="eq" :class="{ on: player.playing }" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        </div>
        <span class="sub">{{ track?.artist ?? '—' }}</span>

        <div
          class="progress"
          :class="{ seekable: canSeek }"
          role="slider"
          :aria-valuenow="percent"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="canSeek ? '播放进度' : '循环进度'"
          @click="onSeek"
        >
          <span :style="{ width: `${Math.max(2, player.progress * 100)}%` }"></span>
        </div>

        <div class="time-row">
          <template v-if="isSynth">
            <span>{{ player.playing ? `${percent}%` : '就绪' }}</span>
            <span>{{ synthLabel }}</span>
          </template>
          <template v-else>
            <span>{{ elapsed }}</span>
            <span>{{ total }}</span>
          </template>
        </div>
      </div>
    </div>

    <div class="controls">
      <button class="ctrl" title="上一首" @click="prev">
        <MagicIcon name="prev" :size="15" />
      </button>
      <button
        class="ctrl main"
        :title="player.playing ? '暂停' : '播放'"
        :aria-pressed="player.playing"
        @click="toggle"
      >
        <MagicIcon :name="player.playing ? 'pause' : 'play'" :size="16" />
      </button>
      <button class="ctrl" title="下一首" @click="next">
        <MagicIcon name="next" :size="15" />
      </button>

      <div class="vol">
        <MagicIcon name="music2" :size="13" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="player.volume"
          aria-label="音量"
          @input="onVolume"
        />
      </div>

      <button
        class="ctrl list-btn"
        :class="{ on: listOpen }"
        :title="`播放列表（${player.playlist.length}）`"
        @click="listOpen = !listOpen"
      >
        <MagicIcon name="menu" :size="15" />
        <span class="count">{{ player.playlist.length }}</span>
      </button>
    </div>

    <PlaylistModal v-model:show="listOpen" />

    <p class="note">
      <template v-if="player.customCount">曲库来自后端 · 上传的音频保存在服务器</template>
      <template v-else>曲库来自后端 · 合成曲由 Web Audio 实时播放</template>
    </p>

    <AddMusicModal v-model:show="addOpen" />
  </section>
</template>

<style scoped>
.music {
  padding-bottom: 14px;
}

.head-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.panel-title .cn {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--c-text-2);
  font-family: var(--font-body);
}

.add-btn {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.28);
  background: rgba(20, 16, 26, 0.6);
  color: var(--c-gold);
  cursor: pointer;
  transition: all 0.22s var(--ease);
}

.add-btn:hover {
  color: #fff3e0;
  border-color: rgba(242, 219, 166, 0.6);
  background: rgba(165, 42, 54, 0.4);
}

.disc-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px 8px;
}

.disc {
  position: relative;
  width: 62px;
  height: 62px;
  flex: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 32% 28%, #2c2130, #16111b 70%);
  border: 1px solid rgba(217, 172, 88, 0.28);
  box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.8), 0 6px 16px -10px #000;
  overflow: hidden;
}

.disc.spin {
  animation: discSpin 5s linear infinite;
}

.disc-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.groove {
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.16);
}

.groove.inner {
  inset: 16px;
  border-color: rgba(217, 172, 88, 0.12);
}

.label {
  position: absolute;
  inset: 24px;
  border-radius: 50%;
  background: linear-gradient(150deg, rgba(165, 42, 54, 0.75), rgba(74, 24, 34, 0.9));
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.6);
}

.hole {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #0f0c13;
  border: 1px solid rgba(217, 172, 88, 0.5);
  z-index: 2;
}

.meta {
  min-width: 0;
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.title-row strong {
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.03em;
  color: var(--c-paper);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.eq {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 10px;
  flex: none;
  opacity: 0;
  transition: opacity 0.24s var(--ease);
}

.eq.on {
  opacity: 0.9;
}

.eq i {
  width: 2px;
  height: 3px;
  border-radius: 1px;
  background: var(--c-gold);
  animation: eqBeat 1s ease-in-out infinite;
}

.eq i:nth-child(2) {
  animation-delay: 0.18s;
}
.eq i:nth-child(3) {
  animation-delay: 0.36s;
}
.eq i:nth-child(4) {
  animation-delay: 0.54s;
}

.sub {
  display: block;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.04em;
  color: var(--c-muted);
  margin: 2px 0 7px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress {
  height: 3px;
  border-radius: 99px;
  background: rgba(217, 172, 88, 0.14);
  overflow: hidden;
}

.progress.seekable {
  cursor: pointer;
}

.progress.seekable:hover {
  height: 4px;
}

.progress span {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #641c2b, #d9ac58);
  transition: width 0.14s linear;
}

.time-row {
  display: flex;
  justify-content: space-between;
  margin-top: 3px;
  font-family: var(--font-mono);
  font-size: 8.5px;
  color: var(--c-muted);
}

.controls {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 18px 0;
}

.ctrl {
  width: 30px;
  height: 30px;
  flex: none;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.18);
  background: rgba(20, 16, 25, 0.7);
  color: var(--c-text-2);
  cursor: pointer;
  transition: all 0.24s var(--ease);
}

.ctrl:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.45);
}

.ctrl.main {
  width: 38px;
  height: 38px;
  color: #fff3df;
  background: linear-gradient(150deg, #a52a36, #641c2b);
  border-color: rgba(242, 219, 166, 0.5);
  box-shadow: 0 8px 20px -12px rgba(199, 60, 75, 0.9);
}

.vol {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  color: var(--c-muted);
}

.vol input {
  width: 54px;
  height: 3px;
  appearance: none;
  border-radius: 99px;
  background: rgba(217, 172, 88, 0.2);
  outline: none;
}

.vol input::-webkit-slider-thumb {
  appearance: none;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--c-gold);
  box-shadow: 0 0 8px rgba(217, 172, 88, 0.8);
  cursor: pointer;
}

.list-btn {
  position: relative;
}

.list-btn.on {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.45);
}

.list-btn .count {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 13px;
  height: 13px;
  padding: 0 3px;
  border-radius: 7px;
  background: linear-gradient(150deg, #c73c4b, #7a2130);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 7.5px;
  line-height: 13px;
  text-align: center;
}

.error {
  margin: 10px 18px 0;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid rgba(199, 60, 75, 0.35);
  background: rgba(165, 42, 54, 0.14);
  color: #ffb3bd;
  font-size: 9.5px;
  line-height: 1.5;
}

.note {
  margin: 10px 18px 0;
  font-size: 9px;
  letter-spacing: 0.04em;
  color: rgba(139, 128, 120, 0.7);
}

@keyframes discSpin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes eqBeat {
  0%, 100% {
    height: 3px;
  }
  50% {
    height: 9px;
  }
}
</style>
