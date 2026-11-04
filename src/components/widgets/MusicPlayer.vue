<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { ChimePlayer, tunes } from '@/lib/chime'
import { toast } from '@/lib/toast'

const player = new ChimePlayer()
const index = ref(0)
const playing = ref(false)
const progress = ref(0)
const volume = ref(0.42)

const tune = computed(() => tunes[index.value])

function syncProgress(ratio: number) {
  progress.value = ratio
}

onMounted(() => {
  player.onProgress = syncProgress
  player.setVolume(volume.value)
})

onBeforeUnmount(() => {
  player.onProgress = null
  player.destroy()
})

async function toggle() {
  if (playing.value) {
    player.pause()
    playing.value = false
    return
  }
  try {
    await player.play()
    playing.value = true
  } catch {
    playing.value = false
    toast.warning('浏览器拦截了音频播放，请再点一次播放按钮')
  }
}

function step(delta: number) {
  index.value = (index.value + delta + tunes.length) % tunes.length
  player.load(tune.value, playing.value)
  progress.value = 0
}

function onVolume(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  volume.value = value
  player.setVolume(value)
}
</script>

<template>
  <section class="music mage-card">
    <div class="panel-title">
      <span>Magic Player</span>
      <span class="cn">魔法留声机</span>
    </div>

    <div class="disc-row">
      <div class="disc" :class="{ spin: playing }">
        <span class="groove"></span>
        <span class="groove inner"></span>
        <span class="label"></span>
        <span class="hole"></span>
      </div>
      <div class="meta">
        <div class="title-row">
          <strong>{{ tune.title }}</strong>
          <span class="eq" :class="{ on: playing }" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        </div>
        <span class="sub">{{ tune.subtitle }}</span>
        <div class="progress">
          <span :style="{ width: `${Math.max(2, progress * 100)}%` }"></span>
        </div>
      </div>
    </div>

    <div class="controls">
      <button class="ctrl" title="上一首" @click="step(-1)">
        <MagicIcon name="prev" :size="15" />
      </button>
      <button
        class="ctrl main"
        :title="playing ? '暂停' : '播放'"
        :aria-pressed="playing"
        @click="toggle"
      >
        <MagicIcon :name="playing ? 'pause' : 'play'" :size="16" />
      </button>
      <button class="ctrl" title="下一首" @click="step(1)">
        <MagicIcon name="next" :size="15" />
      </button>

      <div class="vol">
        <MagicIcon name="music2" :size="13" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="volume"
          aria-label="音量"
          @input="onVolume"
        />
      </div>
    </div>

    <p class="note">Web Audio 实时合成 · 无需外部音频文件</p>
  </section>
</template>

<style scoped>
.music {
  padding-bottom: 14px;
}

.panel-title .cn {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--c-text-2);
  font-family: var(--font-body);
}

.disc-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px 10px;
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
}

.disc.spin {
  animation: discSpin 5s linear infinite;
}

.groove {
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.16);
  box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.015);
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
}

.title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.eq {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 10px;
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

@keyframes eqBeat {
  0%, 100% {
    height: 3px;
  }
  50% {
    height: 9px;
  }
}

.meta {
  min-width: 0;
  flex: 1;
}

.meta strong {
  display: block;
  font-family: var(--font-display);
  font-size: 13.5px;
  letter-spacing: 0.04em;
  color: var(--c-paper);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta .sub {
  display: block;
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.06em;
  color: var(--c-muted);
  margin-bottom: 8px;
}

.progress {
  height: 3px;
  border-radius: 99px;
  background: rgba(217, 172, 88, 0.14);
  overflow: hidden;
}

.progress span {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #641c2b, #d9ac58);
  transition: width 0.18s linear;
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 18px 0;
}

.ctrl {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
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
  gap: 6px;
  margin-left: auto;
  color: var(--c-muted);
}

.vol input {
  width: 62px;
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

.note {
  margin: 10px 18px 0;
  font-size: 9.5px;
  letter-spacing: 0.05em;
  color: rgba(139, 128, 120, 0.7);
}

@keyframes discSpin {
  to {
    transform: rotate(360deg);
  }
}
</style>
