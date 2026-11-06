<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import MagicIcon from '@/components/common/MagicIcon.vue'
import AddMusicModal from '@/components/widgets/AddMusicModal.vue'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores/auth'
import { usePlayerStore, type Track } from '@/stores/player'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ 'update:show': [value: boolean] }>()

const player = usePlayerStore()
const auth = useAuthStore()

const visible = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value),
})

const addOpen = ref(false)
const listRef = ref<HTMLElement | null>(null)
const confirmId = ref('')
let confirmTimer: number | undefined

const customCount = computed(() => player.playlist.filter((item) => item.kind !== 'synth').length)

function kindLabel(item: Track): string {
  if (item.kind === 'synth') return '内置'
  return item.kind === 'file' ? '上传' : '外链'
}

function select(index: number) {
  void player.play(index)
}

function askRemove(item: Track) {
  window.clearTimeout(confirmTimer)
  confirmId.value = item.id
  confirmTimer = window.setTimeout(() => (confirmId.value = ''), 4200)
}

function cancelRemove() {
  window.clearTimeout(confirmTimer)
  confirmId.value = ''
}

async function confirmRemove(item: Track) {
  cancelRemove()
  await player.removeTrack(item.id)
  toast.info(`已从曲库移除：${item.title}`)
}

function close() {
  visible.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !addOpen.value) close()
}

watch(visible, async (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (!open) {
    cancelRemove()
    addOpen.value = false
    window.removeEventListener('keydown', onKeydown)
    return
  }
  window.addEventListener('keydown', onKeydown)
  await nextTick()
  const active = listRef.value?.querySelector<HTMLElement>('.trk.active')
  active?.scrollIntoView({ block: 'center' })
})

onBeforeUnmount(() => {
  window.clearTimeout(confirmTimer)
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="pl">
      <div v-if="visible" class="pl-overlay" @click.self="close">
        <div class="pl-panel" role="dialog" aria-modal="true" aria-label="留声机曲库">
          <header class="pl-top">
            <div class="pl-title">
              <span class="sigil"><MagicIcon name="music2" :size="16" /></span>
              <div>
                <span class="eyebrow">Playlist · 留声机曲库</span>
                <h2>全部曲目</h2>
              </div>
            </div>

            <div class="pl-tools">
              <span class="count">{{ player.playlist.length }} 首<em v-if="customCount"> · 自定义 {{ customCount }}</em></span>
              <button v-if="auth.isAdmin" class="btn-magic small" @click="addOpen = true">
                <MagicIcon name="upload" :size="13" />
                导入音频
              </button>
              <button class="pl-close" aria-label="关闭曲库" @click="close">
                <MagicIcon name="close" :size="15" />
              </button>
            </div>
          </header>

          <div ref="listRef" class="pl-scroll">
            <button
              v-for="(item, i) in player.playlist"
              :key="item.id"
              class="trk"
              :class="{ active: i === player.index, playing: i === player.index && player.playing }"
              @click="select(i)"
            >
              <span class="trk-no">
                <template v-if="i === player.index && player.playing">
                  <i class="bar"></i><i class="bar"></i><i class="bar"></i>
                </template>
                <template v-else>{{ String(i + 1).padStart(2, '0') }}</template>
              </span>

              <span class="trk-main">
                <strong>{{ item.title }}</strong>
                <em>{{ item.artist || '未知艺术家' }}</em>
              </span>

              <span class="trk-kind">{{ kindLabel(item) }}</span>

              <span v-if="i === player.index" class="trk-live">
                {{ player.playing ? '播放中' : '已选中' }}
              </span>

              <span v-if="auth.isAdmin" class="trk-ops" @click.stop>
                <template v-if="confirmId === item.id">
                  <button class="op danger" title="确认删除" @click="confirmRemove(item)">
                    <MagicIcon name="check" :size="12" />
                    确认
                  </button>
                  <button class="op" title="取消" @click="cancelRemove">
                    <MagicIcon name="close" :size="12" />
                  </button>
                </template>
                <button v-else class="op" title="从曲库移除" @click="askRemove(item)">
                  <MagicIcon name="trash" :size="12" />
                </button>
              </span>
            </button>
          </div>

          <footer class="pl-bottom">
            <p>
              <MagicIcon name="lock" :size="11" />
              本地音频存放在浏览器 IndexedDB，仅本机可见；删除后不可恢复。
            </p>
            <p v-if="!auth.isAdmin" class="guest">
              <MagicIcon name="spark" :size="11" />
              访客可以播放与切歌，曲库增删仅博主可用。
            </p>
          </footer>
        </div>

        <AddMusicModal v-model:show="addOpen" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pl-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(8, 6, 12, 0.62);
  backdrop-filter: blur(4px);
}

.pl-panel {
  position: relative;
  width: min(94vw, 580px);
  max-height: min(78vh, 700px);
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1px solid rgba(217, 172, 88, 0.3);
  background:
    radial-gradient(120% 90% at 88% 0%, rgba(165, 42, 54, 0.26), transparent 56%),
    linear-gradient(160deg, #2b2231 0%, #1b1621 54%, #131019 100%);
  box-shadow:
    0 50px 90px -46px #000,
    inset 0 1px 0 rgba(244, 235, 221, 0.06);
  overflow: hidden;
}

.pl-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 18px 20px 14px;
  border-bottom: 1px solid rgba(217, 172, 88, 0.14);
}

.pl-title {
  display: flex;
  align-items: center;
  gap: 11px;
}

.sigil {
  width: 38px;
  height: 38px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.38);
  background: radial-gradient(circle at 34% 28%, rgba(199, 60, 75, 0.55), rgba(22, 16, 28, 0.9) 72%);
  color: var(--c-gold-2);
}

.pl-title h2 {
  margin: 4px 0 0;
  font-size: 19px;
  letter-spacing: 0.06em;
}

.pl-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.count {
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.04em;
  color: var(--c-muted);
  white-space: nowrap;
}

.count em {
  font-style: normal;
  color: var(--c-gold-dim);
}

.btn-magic.small {
  padding: 6px 12px;
  font-size: 11px;
  gap: 5px;
}

.pl-close {
  width: 28px;
  height: 28px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.2);
  background: rgba(14, 10, 19, 0.66);
  color: var(--c-text-2);
  cursor: pointer;
  transition: all 0.22s var(--ease);
}

.pl-close:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.55);
}

/* 列表：超高时内部滚动 */
.pl-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px 10px 10px;
  scrollbar-width: thin;
  scrollbar-color: rgba(165, 42, 54, 0.45) transparent;
}

.pl-scroll::-webkit-scrollbar {
  width: 5px;
}

.pl-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.pl-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(165, 42, 54, 0.4);
}

.pl-scroll:hover::-webkit-scrollbar-thumb {
  background: rgba(217, 172, 88, 0.6);
}

.trk {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--c-text);
  text-align: left;
  cursor: pointer;
  transition: background 0.22s var(--ease), border-color 0.22s var(--ease);
}

.trk + .trk {
  margin-top: 2px;
}

.trk:hover {
  background: rgba(217, 172, 88, 0.06);
  border-color: rgba(217, 172, 88, 0.12);
}

.trk.active {
  background: linear-gradient(90deg, rgba(165, 42, 54, 0.34), rgba(165, 42, 54, 0.06) 72%, transparent);
  border-color: rgba(217, 172, 88, 0.26);
}

.trk-no {
  width: 22px;
  flex: none;
  display: inline-flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  height: 14px;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--c-gold-dim);
}

.trk.active .trk-no {
  color: var(--c-gold-2);
}

.trk-no .bar {
  width: 2px;
  height: 4px;
  border-radius: 1px;
  background: var(--c-gold);
  animation: trkBeat 0.9s ease-in-out infinite;
}

.trk-no .bar:nth-child(2) {
  animation-delay: 0.18s;
}

.trk-no .bar:nth-child(3) {
  animation-delay: 0.36s;
}

.trk-main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.trk-main strong {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--c-paper);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trk-main em {
  font-style: normal;
  font-size: 10px;
  color: var(--c-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trk-kind {
  flex: none;
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.22);
  color: var(--c-muted);
}

.trk-live {
  flex: none;
  font-size: 9px;
  letter-spacing: 0.06em;
  color: var(--c-gold);
}

.trk-ops {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.op {
  height: 24px;
  min-width: 24px;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.16);
  background: rgba(14, 10, 19, 0.5);
  color: var(--c-muted);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.op:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.45);
}

.op.danger {
  color: #ffb3bd;
  border-color: rgba(199, 60, 75, 0.45);
  background: rgba(165, 42, 54, 0.18);
}

.pl-bottom {
  padding: 11px 20px 14px;
  border-top: 1px solid rgba(217, 172, 88, 0.12);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pl-bottom p {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9.5px;
  line-height: 1.6;
  color: var(--c-muted);
}

.pl-bottom .guest {
  color: var(--c-gold-dim);
}

/* 进出场 */
.pl-enter-active {
  transition: opacity 0.26s var(--ease);
}

.pl-leave-active {
  transition: opacity 0.2s var(--ease);
}

.pl-enter-from,
.pl-leave-to {
  opacity: 0;
}

.pl-enter-active .pl-panel {
  animation: plRise 0.36s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.pl-leave-active .pl-panel {
  transition: transform 0.2s var(--ease), opacity 0.2s var(--ease);
}

.pl-leave-to .pl-panel {
  transform: translateY(10px) scale(0.985);
  opacity: 0;
}

@keyframes plRise {
  from {
    transform: translateY(16px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes trkBeat {
  0%, 100% {
    height: 4px;
  }
  50% {
    height: 13px;
  }
}

@media (max-width: 620px) {
  .pl-overlay {
    padding: 12px;
    align-items: flex-end;
  }
  .pl-panel {
    width: 100%;
    max-height: 82vh;
    border-radius: 16px;
  }
  .pl-top {
    padding: 15px 15px 12px;
  }
  .count {
    display: none;
  }
  .trk-kind {
    display: none;
  }
  .pl-bottom {
    padding: 10px 15px 13px;
  }
}
</style>
