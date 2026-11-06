<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NModal } from 'naive-ui'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { formatBytes } from '@/lib/image'
import { toast } from '@/lib/toast'
import { usePlayerStore } from '@/stores/player'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ 'update:show': [value: boolean] }>()

const player = usePlayerStore()
const fileInput = ref<HTMLInputElement | null>(null)

const visible = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value),
})

const mode = ref<'file' | 'url'>('file')
const file = ref<File | null>(null)
const fileTitle = ref('')
const fileArtist = ref('')
const fileCover = ref('')
const dragging = ref(false)
const adding = ref(false)
const localError = ref('')

const urlForm = ref({ title: '', artist: '', cover: '', src: '' })

watch(
  () => props.show,
  (open) => {
    if (!open) return
    mode.value = 'file'
    file.value = null
    fileTitle.value = ''
    fileArtist.value = ''
    fileCover.value = ''
    localError.value = ''
    urlForm.value = { title: '', artist: '', cover: '', src: '' }
  },
)

const fileSize = computed(() => (file.value ? formatBytes(file.value.size) : ''))

function pickFile(next?: File | null) {
  if (!next) return
  if (!next.type.startsWith('audio/') && !/\.(mp3|flac|wav|ogg|m4a|aac)$/i.test(next.name)) {
    localError.value = '只支持 MP3 / FLAC / WAV / M4A 等音频文件'
    return
  }
  localError.value = ''
  file.value = next
  if (!fileTitle.value) fileTitle.value = next.name.replace(/\.[^.]+$/, '')
}

function onFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  pickFile(input.files?.[0])
  input.value = ''
}

function onDrop(event: DragEvent) {
  dragging.value = false
  pickFile(event.dataTransfer?.files?.[0])
}

async function addLocal() {
  if (!file.value) {
    localError.value = '请先选择音频文件'
    return
  }
  adding.value = true
  const track = await player.addFile(file.value, {
    title: fileTitle.value,
    artist: fileArtist.value,
    cover: fileCover.value,
  })
  adding.value = false
  if (track) {
    visible.value = false
    toast.success(`已加入播放列表：${track.title}`)
  } else if (player.error) {
    localError.value = player.error
  }
}

function addRemote() {
  void (async () => {
    const track = await player.addUrl(urlForm.value)
    if (!track) {
      toast.warning(player.error || '请检查表单')
      return
    }
    visible.value = false
    toast.success(`已加入播放列表：${track.title}`)
  })()
}
</script>

<template>
  <n-modal v-model:show="visible" :mask-closable="true" transform-origin="center">
    <div class="add-music mage-card">
      <button class="close" aria-label="关闭" @click="visible = false">
        <MagicIcon name="close" :size="14" />
      </button>

      <div class="head">
        <span class="badge"><MagicIcon name="music2" :size="15" /></span>
        <div>
          <span class="eyebrow">Playlist · 添加音乐</span>
          <h2>往留声机里放一张唱片</h2>
          <p>本地文件会上传到服务器（30MB 以内）；外链只保存地址。曲目会进入全站曲库。</p>
        </div>
      </div>

      <div class="tabs">
        <button class="tab" :class="{ active: mode === 'file' }" @click="mode = 'file'">
          <MagicIcon name="upload" :size="13" />
          本地音频
        </button>
        <button class="tab" :class="{ active: mode === 'url' }" @click="mode = 'url'">
          <MagicIcon name="external" :size="13" />
          网络链接
        </button>
      </div>

      <form v-if="mode === 'file'" class="form" @submit.prevent="addLocal">
        <div
          class="dropzone"
          :class="{ over: dragging, filled: file }"
          @click="fileInput?.click()"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <MagicIcon :name="file ? 'music' : 'upload'" :size="20" />
          <strong>{{ file ? file.name : '选择或拖拽音频文件' }}</strong>
          <span>{{ file ? fileSize + ' · 已就绪' : 'MP3 / FLAC / WAV / M4A' }}</span>
        </div>
        <input ref="fileInput" type="file" accept="audio/*,.mp3,.flac,.wav,.m4a" hidden @change="onFileInput" />

        <div class="row-2">
          <label class="field">
            <span>曲名</span>
            <input v-model="fileTitle" placeholder="默认使用文件名" />
          </label>
          <label class="field">
            <span>艺术家</span>
            <input v-model="fileArtist" placeholder="可选" />
          </label>
        </div>

        <label class="field">
          <span>封面图地址（可选）</span>
          <input v-model="fileCover" placeholder="https://… 或 assets/…" />
        </label>

        <p v-if="localError" class="error">{{ localError }}</p>
        <p class="tip">
          <MagicIcon name="lock" :size="10" />
          音频写入浏览器 IndexedDB，仅本机可见；清理浏览器数据会一并删除。
        </p>

        <button type="submit" class="btn-magic full" :disabled="adding || !file">
          <MagicIcon name="plus" :size="14" />
          {{ adding ? '正在写入…' : '加入播放列表' }}
        </button>
      </form>

      <form v-else class="form" @submit.prevent="addRemote">
        <label class="field">
          <span>曲名</span>
          <input v-model="urlForm.title" placeholder="例如：爆裂魔法のテーマ" />
        </label>
        <div class="row-2">
          <label class="field">
            <span>艺术家</span>
            <input v-model="urlForm.artist" placeholder="可选" />
          </label>
          <label class="field">
            <span>封面图地址</span>
            <input v-model="urlForm.cover" placeholder="https://…" />
          </label>
        </div>
        <label class="field">
          <span>音频直链</span>
          <input v-model="urlForm.src" placeholder="https://…/song.mp3 或 assets/audio/song.mp3" />
        </label>
        <p class="tip">
          <MagicIcon name="external" :size="10" />
          外链需允许跨域播放；也可以把文件放进 public/assets/audio/ 后用相对路径引用。
        </p>

        <button type="submit" class="btn-magic full">
          <MagicIcon name="plus" :size="14" />
          加入播放列表
        </button>
      </form>
    </div>
  </n-modal>
</template>

<style scoped>
.add-music {
  position: relative;
  width: min(92vw, 500px);
  padding: 24px 24px 18px;
  background:
    radial-gradient(120% 100% at 88% 0%, rgba(165, 42, 54, 0.3), transparent 58%),
    linear-gradient(160deg, #2b2231 0%, #1b1621 52%, #141019 100%);
  border-color: rgba(217, 172, 88, 0.32);
  box-shadow: 0 40px 80px -40px #000;
}

.close {
  position: absolute;
  right: 12px;
  top: 12px;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.2);
  background: rgba(16, 12, 20, 0.6);
  color: var(--c-text-2);
  cursor: pointer;
  z-index: 2;
}

.close:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.5);
}

.head {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-right: 24px;
}

.badge {
  width: 38px;
  height: 38px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.4);
  background: radial-gradient(circle, rgba(165, 42, 54, 0.5), rgba(20, 15, 26, 0.8));
  color: var(--c-gold-2);
}

.head h2 {
  margin: 5px 0 5px;
  font-size: 19px;
  letter-spacing: 0.04em;
}

.head p {
  margin: 0;
  font-size: 10.5px;
  line-height: 1.7;
  color: var(--c-muted);
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.14);
  background: rgba(14, 11, 19, 0.6);
  margin-bottom: 14px;
}

.tab {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: var(--c-text-2);
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.24s var(--ease);
}

.tab.active {
  color: #fff3e0;
  background: linear-gradient(150deg, rgba(165, 42, 54, 0.8), rgba(100, 28, 43, 0.5));
  box-shadow: inset 0 0 0 1px rgba(217, 172, 88, 0.24);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 16px;
  border-radius: 10px;
  border: 1px dashed rgba(217, 172, 88, 0.32);
  background: rgba(12, 9, 16, 0.5);
  color: var(--c-muted);
  cursor: pointer;
  transition: all 0.22s var(--ease);
}

.dropzone:hover,
.dropzone.over,
.dropzone.filled {
  border-color: rgba(217, 172, 88, 0.62);
  background: rgba(165, 42, 54, 0.12);
  color: var(--c-gold-2);
}

.dropzone strong {
  font-size: 11.5px;
  color: var(--c-text);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropzone span {
  font-family: var(--font-mono);
  font-size: 8.5px;
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field span {
  font-size: 9.5px;
  letter-spacing: 0.08em;
  color: var(--c-muted);
}

.field input {
  padding: 8px 11px;
  border-radius: 8px;
  border: 1px solid rgba(217, 172, 88, 0.18);
  background: rgba(12, 9, 16, 0.7);
  color: var(--c-text);
  font-family: inherit;
  font-size: 12px;
  outline: none;
  transition: border-color 0.22s var(--ease);
}

.field input:focus {
  border-color: rgba(217, 172, 88, 0.5);
}

.tip {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  font-size: 9.5px;
  line-height: 1.6;
  color: var(--c-muted);
}

.error {
  margin: 0;
  padding: 6px 9px;
  border-radius: 6px;
  border: 1px solid rgba(199, 60, 75, 0.4);
  background: rgba(165, 42, 54, 0.16);
  color: #ffb3bd;
  font-size: 10.5px;
}

.btn-magic.full {
  width: 100%;
  padding: 9px;
  font-size: 12px;
  margin-top: 2px;
}

.btn-magic.full:disabled {
  opacity: 0.55;
  cursor: default;
}

@media (max-width: 560px) {
  .row-2 {
    grid-template-columns: 1fr;
  }
}
</style>
