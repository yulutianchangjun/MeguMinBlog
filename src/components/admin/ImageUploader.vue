<script setup lang="ts">
import { computed, ref } from 'vue'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { adminApi } from '@/api'
import { resolveAsset } from '@/lib/asset'
import { fileToCoverBlob, formatBytes } from '@/lib/image'
import { apiReady } from '@/lib/http'
import { toast } from '@/lib/toast'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    hint?: string
    compact?: boolean
  }>(),
  { modelValue: '', label: '封面图', hint: 'JPG / PNG / WebP，自动压缩到长边 1280', compact: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const inputRef = ref<HTMLInputElement | null>(null)
const processing = ref(false)
const dragging = ref(false)
const meta = ref('')

const preview = computed(() => resolveAsset(props.modelValue))

async function handleFile(file?: File | null) {
  if (!file) return
  if (!apiReady) {
    toast.warning('未连接后端，无法上传图片')
    return
  }
  processing.value = true
  try {
    // 1. 本地压缩（长边 1280，WebP）
    const result = await fileToCoverBlob(file)
    // 2. 上传到后端，拿到 /uploads/xxx 持久地址
    const uploadFile = new File([result.blob], `cover.${result.ext}`, {
      type: result.blob.type,
    })
    const uploaded = await adminApi.upload(uploadFile)
    emit('update:modelValue', uploaded.url)
    meta.value = `${result.width}×${result.height} · ${formatBytes(result.bytes)}`
    toast.success('封面已上传，记得点保存')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '图片上传失败')
  } finally {
    processing.value = false
  }
}

function onPick(event: Event) {
  const input = event.target as HTMLInputElement
  void handleFile(input.files?.[0])
  input.value = ''
}

function onDrop(event: DragEvent) {
  dragging.value = false
  void handleFile(event.dataTransfer?.files?.[0])
}

function clear() {
  emit('update:modelValue', '')
  meta.value = ''
}
</script>

<template>
  <div class="uploader" :class="{ compact }">
    <div class="field-head">
      <span>{{ label }}</span>
      <em v-if="meta">{{ meta }}</em>
      <em v-else-if="modelValue">当前：{{ modelValue.split('/').pop() }}</em>
    </div>

    <div v-if="preview" class="preview-wrap">
      <img :src="preview" alt="封面预览" />
      <div class="preview-mask">
        <button class="mini-action" @click="inputRef?.click()">
          <MagicIcon name="upload" :size="13" />
          更换
        </button>
        <button class="mini-action danger" @click="clear">
          <MagicIcon name="trash" :size="13" />
          移除
        </button>
      </div>
    </div>

    <div
      v-else
      class="dropzone"
      :class="{ over: dragging, busy: processing }"
      @click="inputRef?.click()"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <MagicIcon :name="processing ? 'clock' : 'upload'" :size="20" />
      <strong>{{ processing ? '正在压缩…' : '选择本地图片' }}</strong>
      <span>或拖拽到这里 · {{ hint }}</span>
    </div>

    <input ref="inputRef" type="file" accept="image/*" hidden @change="onPick" />
  </div>
</template>

<style scoped>
.uploader {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--c-muted);
}

.field-head em {
  font-style: normal;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--c-gold-dim);
}

.preview-wrap {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(217, 172, 88, 0.2);
  background: rgba(12, 9, 16, 0.7);
  aspect-ratio: 16 / 9;
}

.preview-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.preview-mask {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 8px;
  background: linear-gradient(180deg, transparent, rgba(10, 7, 13, 0.85));
  opacity: 0;
  transition: opacity 0.24s var(--ease);
}

.preview-wrap:hover .preview-mask {
  opacity: 1;
}

.mini-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.24);
  background: rgba(20, 16, 26, 0.85);
  color: var(--c-text-2);
  font-size: 10.5px;
  cursor: pointer;
}

.mini-action:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.5);
}

.mini-action.danger:hover {
  color: #ffb3bd;
  border-color: rgba(199, 60, 75, 0.6);
}

.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 18px 14px;
  border-radius: 10px;
  border: 1px dashed rgba(217, 172, 88, 0.3);
  background: rgba(12, 9, 16, 0.5);
  color: var(--c-muted);
  cursor: pointer;
  transition: all 0.22s var(--ease);
}

.dropzone:hover,
.dropzone.over {
  border-color: rgba(217, 172, 88, 0.62);
  background: rgba(165, 42, 54, 0.12);
  color: var(--c-gold-2);
}

.dropzone.busy {
  cursor: progress;
  opacity: 0.75;
}

.dropzone strong {
  font-size: 11.5px;
  color: var(--c-text);
}

.dropzone span {
  font-family: var(--font-mono);
  font-size: 8.5px;
  text-align: center;
}

.compact .preview-wrap {
  aspect-ratio: 21 / 8;
  max-height: 92px;
}
</style>
