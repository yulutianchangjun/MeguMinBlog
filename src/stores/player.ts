import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { adminApi, publicApi, type ApiMusic } from '@/api'
import { ChimePlayer, tunes } from '@/lib/chime'
import { resolveAsset } from '@/lib/asset'
import { apiReady } from '@/lib/http'
import { readJSON, writeJSON } from '@/lib/storage'
import { useAuthStore } from '@/stores/auth'

export type TrackKind = 'synth' | 'url' | 'file'

export interface Track {
  id: string
  title: string
  artist: string
  cover: string
  kind: TrackKind
  /** 外链 / 服务器上传后的可访问地址 */
  src?: string
  /** 合成曲对应的曲谱 id（chime.ts 内置引擎曲谱） */
  tuneId?: string
  size?: number
}

interface PersistedPlayer {
  volume: number
  index: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function mapTrack(source: ApiMusic): Track {
  if (source.kind === 'synth') {
    return {
      id: String(source.id),
      title: source.title,
      artist: source.artist ?? '惠惠的留声机',
      cover: source.cover ?? '',
      kind: 'synth',
      tuneId: source.url,
    }
  }
  return {
    id: String(source.id),
    title: source.title,
    artist: source.artist ?? '未知艺术家',
    cover: source.cover ?? '',
    kind: source.kind === 'file' ? 'file' : 'url',
    src: source.url,
    size: source.size,
  }
}

/**
 * 播放器：曲库完全来自后端 GET /api/music。
 * - synth：内置 Web Audio 合成曲（曲谱引擎在前端，曲目列表存数据库）
 * - file / url：管理员上传到服务器 / 填写外链的曲目
 */
export const usePlayerStore = defineStore('player', () => {
  const auth = useAuthStore()
  const saved = readJSON<PersistedPlayer>('player', { volume: 0.42, index: 0 })
  const playlist = ref<Track[]>([])
  const index = ref(clamp(saved.index ?? 0, 0, Math.max(0, playlist.value.length - 1)))
  const volume = ref(saved.volume ?? 0.42)

  const playing = ref(false)
  const progress = ref(0)
  const currentTime = ref(0)
  const duration = ref(0)
  const error = ref('')
  const loaded = ref(false)

  const chime = new ChimePlayer()
  chime.setVolume(volume.value)

  const current = computed<Track | undefined>(() => playlist.value[index.value])
  const currentTune = computed(() => tunes.find((tune) => tune.id === current.value?.tuneId))
  const customCount = computed(() => playlist.value.filter((t) => t.kind !== 'synth').length)

  const audio = shallowRef<HTMLAudioElement | null>(null)
  const loadedId = ref('')

  chime.onProgress = (ratio) => {
    if (current.value?.kind === 'synth' && playing.value) progress.value = ratio
  }

  function persist() {
    writeJSON('player', {
      volume: volume.value,
      index: index.value,
    } satisfies PersistedPlayer)
  }

  async function load(): Promise<void> {
    if (!apiReady || loaded.value) {
      if (!apiReady) loaded.value = true
      return
    }
    try {
      const list = await publicApi.music()
      playlist.value = list.map(mapTrack)
      index.value = clamp(index.value, 0, Math.max(0, playlist.value.length - 1))
      loaded.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '曲库加载失败'
    }
  }

  async function reload(): Promise<void> {
    loaded.value = false
    await load()
  }

  function ensureAudio(): HTMLAudioElement {
    if (audio.value) return audio.value
    const element = new Audio()
    element.preload = 'metadata'
    element.volume = volume.value
    element.addEventListener('timeupdate', () => {
      currentTime.value = element.currentTime
      duration.value = Number.isFinite(element.duration) ? element.duration : 0
      progress.value = duration.value ? element.currentTime / duration.value : 0
    })
    element.addEventListener('loadedmetadata', () => {
      duration.value = Number.isFinite(element.duration) ? element.duration : 0
    })
    element.addEventListener('ended', () => {
      void next()
    })
    element.addEventListener('error', () => {
      if (current.value?.kind !== 'synth') {
        error.value = '音频加载失败，请检查链接或重新上传'
        playing.value = false
      }
    })
    audio.value = element
    return element
  }

  function stopEngines() {
    chime.pause()
    audio.value?.pause()
  }

  function resolveSrc(track: Track): string {
    const src = track.src ?? ''
    if (!src) return ''
    if (/^(https?:|data:|blob:)/i.test(src)) return src
    if (src.startsWith('/')) return src
    return resolveAsset(src)
  }

  async function play(target?: number) {
    if (target !== undefined) index.value = clamp(target, 0, playlist.value.length - 1)
    const track = current.value
    if (!track) return
    stopEngines()
    error.value = ''
    progress.value = 0
    currentTime.value = 0
    duration.value = 0

    if (track.kind === 'synth') {
      const tune = tunes.find((item) => item.id === track.tuneId) ?? tunes[0]
      chime.load(tune, false)
      try {
        await chime.play()
        playing.value = true
        loadedId.value = track.id
      } catch {
        playing.value = false
        error.value = '浏览器拦截了音频播放，请再点一次播放'
      }
      persist()
      return
    }

    const src = resolveSrc(track)
    if (!src) {
      error.value = '音频源不可用，请重新添加'
      return
    }
    const element = ensureAudio()
    if (loadedId.value !== track.id || element.src !== src) {
      element.src = src
      loadedId.value = track.id
    }
    try {
      await element.play()
      playing.value = true
      persist()
    } catch {
      playing.value = false
      error.value = '浏览器拦截了音频播放，请再点一次播放'
    }
  }

  async function toggle() {
    if (playing.value) {
      pause()
      return
    }
    const track = current.value
    if (!track) return
    if (loadedId.value === track.id) {
      try {
        if (track.kind === 'synth') await chime.play()
        else await ensureAudio().play()
        playing.value = true
      } catch {
        error.value = '播放失败，请重新选择曲目'
        playing.value = false
      }
      return
    }
    await play(index.value)
  }

  function pause() {
    stopEngines()
    playing.value = false
  }

  async function next(auto = false) {
    if (!playlist.value.length) return
    const wasPlaying = playing.value || auto
    index.value = (index.value + 1) % playlist.value.length
    if (wasPlaying) await play(index.value)
    else {
      resetProgress()
      persist()
    }
  }

  async function prev() {
    if (!playlist.value.length) return
    const wasPlaying = playing.value
    index.value = (index.value - 1 + playlist.value.length) % playlist.value.length
    if (wasPlaying) await play(index.value)
    else {
      resetProgress()
      persist()
    }
  }

  function resetProgress() {
    progress.value = 0
    currentTime.value = 0
    duration.value = 0
    loadedId.value = ''
  }

  function seek(ratio: number) {
    const track = current.value
    if (!track || track.kind === 'synth') return
    const element = ensureAudio()
    if (!duration.value) return
    element.currentTime = clamp(ratio, 0, 1) * duration.value
    progress.value = clamp(ratio, 0, 1)
  }

  function setVolume(value: number) {
    volume.value = clamp(value, 0, 1)
    chime.setVolume(volume.value)
    if (audio.value) audio.value.volume = volume.value
    persist()
  }

  /** 上传本地音频到服务器并加入后端曲库（仅博主） */
  async function addFile(
    file: File,
    meta?: { title?: string; artist?: string; cover?: string },
  ): Promise<Track | null> {
    if (!apiReady) {
      error.value = '未连接后端，无法添加音乐'
      return null
    }
    if (!auth.isAdmin) {
      error.value = '只有博主可以添加音乐'
      return null
    }
    if (!file.type.startsWith('audio/') && !/\.(mp3|flac|wav|ogg|m4a|aac)$/i.test(file.name)) {
      error.value = '请选择音频文件（MP3 / FLAC / WAV / M4A）'
      return null
    }
    try {
      const uploaded = await adminApi.uploadAudio(file)
      const created = await adminApi.createMusic({
        title: (meta?.title ?? '').trim() || file.name.replace(/\.[^.]+$/, ''),
        artist: (meta?.artist ?? '').trim() || '上传曲目',
        cover: (meta?.cover ?? '').trim(),
        url: uploaded.url,
        kind: 'file',
        size: file.size,
      })
      await reload()
      const track = mapTrack(created)
      if (!playing.value) {
        const position = playlist.value.findIndex((item) => item.id === track.id)
        if (position >= 0) {
          index.value = position
          resetProgress()
        }
      }
      return track
    } catch (err) {
      error.value = err instanceof Error ? err.message : '上传失败'
      return null
    }
  }

  /** 添加外链曲目到后端曲库（仅博主） */
  async function addUrl(input: { title: string; artist?: string; cover?: string; src: string }): Promise<Track | null> {
    if (!apiReady) {
      error.value = '未连接后端，无法添加音乐'
      return null
    }
    if (!auth.isAdmin) {
      error.value = '只有博主可以添加音乐'
      return null
    }
    const title = input.title.trim()
    const src = input.src.trim()
    if (!title) {
      error.value = '请填写曲名'
      return null
    }
    if (!src || !/^(https?:\/\/|\/)/i.test(src)) {
      error.value = '请填写有效的音频地址（http(s) 或以 / 开头的路径）'
      return null
    }
    try {
      const created = await adminApi.createMusic({
        title,
        artist: (input.artist ?? '').trim() || '网络音频',
        cover: (input.cover ?? '').trim(),
        url: src,
        kind: 'url',
      })
      await reload()
      const track = mapTrack(created)
      if (!playing.value) {
        const position = playlist.value.findIndex((item) => item.id === track.id)
        if (position >= 0) {
          index.value = position
          resetProgress()
        }
      }
      return track
    } catch (err) {
      error.value = err instanceof Error ? err.message : '添加失败'
      return null
    }
  }

  /** 从后端曲库移除曲目（仅博主） */
  async function removeTrack(id: string): Promise<void> {
    const numeric = Number(id)
    if (!Number.isFinite(numeric)) return
    const wasCurrent = current.value?.id === id
    const currentId = current.value?.id
    if (wasCurrent) {
      pause()
      resetProgress()
    }
    try {
      await adminApi.deleteMusic(numeric)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除失败'
      return
    }
    await reload()
    if (wasCurrent) {
      index.value = clamp(index.value, 0, Math.max(0, playlist.value.length - 1))
      loadedId.value = ''
    } else if (currentId) {
      const nextIndex = playlist.value.findIndex((track) => track.id === currentId)
      if (nextIndex >= 0) index.value = nextIndex
    }
  }

  function coverUrl(track?: Track): string {
    if (!track?.cover) return ''
    if (/^(https?:|data:|\/)/i.test(track.cover)) return track.cover
    return resolveAsset(track.cover)
  }

  function dispose() {
    pause()
    chime.destroy()
    if (audio.value) {
      audio.value.src = ''
      audio.value = null
    }
  }

  return {
    playlist,
    index,
    volume,
    playing,
    progress,
    currentTime,
    duration,
    error,
    loaded,
    current,
    currentTune,
    customCount,
    load,
    reload,
    play,
    toggle,
    pause,
    next,
    prev,
    seek,
    setVolume,
    addFile,
    addUrl,
    removeTrack,
    coverUrl,
    dispose,
  }
})
